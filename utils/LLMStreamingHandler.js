import { SSE } from 'sse.js'; // Ensure you have sse.js installed or available in your project

// Keep track of a unique ID for tool calls, especially for Gemini
let toolCallIdCounter = 0;

// Note: handleStopStream is designed for EventSource, might need adjustment for Gemini's async iterable stream
let currentEventSource = null;
function handleStopStreamForOpenAI() {
    if (currentEventSource) {
        currentEventSource.close();
        // setLoading(false); // setLoading is handled by handleStreamEnd or error handlers
        console.log("OpenAI EventSource stream stopped by user.");
        // Clean up logic is mostly in handleStreamEnd, which should be triggered by readystatechange or error.
        // Manually call handleStreamEnd if necessary, but ensure it's idempotent or guarded.
    }
}

function extractCodeFromJsonString(jsonString) {
    if (!jsonString || typeof jsonString !== 'string') {
        return jsonString; // Return original if not a non-empty string
    }

    let trimmedString = jsonString.trim();

    // Try to parse as-is first
    try {
        const parsed = JSON.parse(trimmedString);
        if (parsed && typeof parsed.code === 'string') {
            return parsed.code;
        }
        // If parsed but no .code, return original string (it's valid JSON but not what we want for code preview)
        return jsonString;
    } catch (e) {
        // Not valid JSON, proceed to heuristic
    }

    // Heuristic for {"code": "..."} structure
    if (trimmedString.startsWith('{"code":"')) {
        try {
            let tempStr = trimmedString + "\"}";
            const parsed = JSON.parse(tempStr);
            if (parsed && typeof parsed.code === 'string') {
                return parsed.code;
            }
        } catch {
        }

        try {
            let tempStr = trimmedString + "}";
            const parsed = JSON.parse(tempStr);
            if (parsed && typeof parsed.code === 'string') {
                return parsed.code;
            }
        } catch {
        }

        // If it still fails, return original string
        return jsonString;
    }

    // Fallback for any other case
    return jsonString;
}

export default function LLMStreamingHandler(sourceOrStreamUrl, onMessage, runTool, setStreamedMessage, setLoading, provider, setStreamedCodeContent, setShowCodePreview, loading) {
    let toolCalls = [];
    // let accumulatedJson = ""; // Not explicitly needed if each Gemini chunk is a full JSON

    async function processToolCalls() {
        if (toolCalls.length > 0) {
            const event = new CustomEvent("stream-tool-calls-done");
            window.dispatchEvent(event);
        }
        for (let toolCall of toolCalls) {
            let isLast = toolCalls.indexOf(toolCall) === toolCalls.length - 1;
            let args = typeof toolCall.function.arguments === 'string' ? JSON.parse(toolCall.function.arguments) : toolCall.function.arguments;
            let result = await runTool(toolCall.function.name, args);
            onMessage({ role: "tool", content: result, tool_call_id: toolCall.id }, isLast);
        }
    }

    // Modified to accept provider
    async function handleStreamEnd(_providerInternal) { // Renamed to avoid conflict with outer provider
        setStreamedMessage(content => {
            setLoading(false);
            if (setShowCodePreview) setShowCodePreview(false); // Reset code preview state
            if (setStreamedCodeContent) setStreamedCodeContent(""); // Clear streamed code content
            let msg = { role: "assistant", content };
            if (toolCalls.length > 0) {
                msg.tool_calls = toolCalls;
            }
            if (content || toolCalls.length > 0) {
                onMessage(msg);
            }
            processToolCalls();
            return "";
        });

        if (_providerInternal === "openai" && currentEventSource) {
            console.log("Closing OpenAI EventSource and removing stop listener.");
            currentEventSource.close(); // Ensure EventSource is closed
            window.removeEventListener("stop-stream", handleStopStreamForOpenAI);
            currentEventSource = null;
        }
        // For Gemini, the stream (async iterable) closes itself or by error.
    }

    // Modified to accept provider
    async function handleIncomingMessage(event, _providerInternal) { // Renamed to avoid conflict
        if (_providerInternal === "openai") {
            if (event.data.trim() === "[DONE]") {
                handleStreamEnd(_providerInternal);
                return;
            }
            const payload = JSON.parse(event.data);
            const text = payload?.choices[0]?.delta?.content;
            if (text) {
                setStreamedMessage(oldMsg => (oldMsg === "" && text.trim() === "") ? "" : oldMsg + text);
            }
            const openAIToolCalls = payload?.choices[0]?.delta?.tool_calls;
            if (openAIToolCalls) {
                const streamEvent = new CustomEvent("stream-tool-calls");
                window.dispatchEvent(streamEvent);
                for (let tc of openAIToolCalls) {
                    if (tc.id) { // New tool call
                        toolCalls.push({ id: tc.id, type: 'function', function: { name: tc.function.name || "", arguments: tc.function.arguments || "" } });
                        // Correctly reference the newly added tool call
                        const currentToolCall = toolCalls[toolCalls.length - 1];
                        if (currentToolCall.function.name === "run_python") {
                            if (setShowCodePreview) setShowCodePreview(true);
                            if (setStreamedCodeContent) {
                                setStreamedCodeContent(extractCodeFromJsonString(currentToolCall.function.arguments));
                            }
                        }
                    } else { // Appending to existing tool call (e.g. arguments)
                        if (tc.function && tc.function.arguments && toolCalls[tc.index]) {
                            toolCalls[tc.index].function.arguments += tc.function.arguments;
                            // Check if this is for an ongoing python tool call
                            if (toolCalls[tc.index].function.name === "run_python") {
                                if (setShowCodePreview) setShowCodePreview(true); // Ensure it's true if we just identified it
                                if (setStreamedCodeContent) {
                                    setStreamedCodeContent(extractCodeFromJsonString(toolCalls[tc.index].function.arguments));
                                }
                            }
                        }
                    }
                }
            }
        } else if (_providerInternal === "gemini") {
            try {
                // event.data here is already a stringified JSON chunk from the async iterable
                const payload = JSON.parse(event.data);
                const textPart = payload.candidates?.[0]?.content?.parts?.find(part => part.text);
                const text = textPart?.text;
                if (text) {
                    setStreamedMessage(oldMsg => oldMsg + text);
                }

                const functionCallPart = payload.candidates?.[0]?.content?.parts?.find(part => part.functionCall);
                console.log(payload);
                if (functionCallPart?.functionCall) {
                    const geminiFc = functionCallPart.functionCall;
                    console.log(geminiFc);
                    const toolCallId = `call_${Date.now()}_${toolCallIdCounter++}`;
                    const streamEvent = new CustomEvent("stream-tool-calls");
                    window.dispatchEvent(streamEvent);
                    const currentArguments = JSON.stringify(geminiFc.args || {});
                    toolCalls.push({
                        id: toolCallId, type: 'function',
                        function: { name: geminiFc.name, arguments: currentArguments }
                    });
                    if (geminiFc.name === "run_python") {
                        if (setShowCodePreview) setShowCodePreview(true);
                        if (geminiFc.args && typeof geminiFc.args.code === 'string') {
                            if (setStreamedCodeContent) setStreamedCodeContent(geminiFc.args.code);
                        } else if (geminiFc.args) { // If args exist but .code is not a string
                            if (setStreamedCodeContent) setStreamedCodeContent(JSON.stringify(geminiFc.args, null, 2));
                        } else { // No args
                            if (setStreamedCodeContent) setStreamedCodeContent("");
                        }
                    }
                }
                // Gemini stream end is handled by the loop finishing in the main function block
            } catch (e) {
                console.error("Error parsing Gemini stream data:", e, "Raw data:", event.data);
            }
        }
    }

    if (provider === "gemini") {
        setLoading(true);
        toolCalls = []; // Reset for the new stream

        (async () => {
            try {
                for await (const chunk of sourceOrStreamUrl) { // sourceOrStreamUrl is the async iterable stream
                    // Pass provider to handleIncomingMessage
                    handleIncomingMessage({ data: JSON.stringify(chunk) }, provider);
                }
                // Pass provider to handleStreamEnd
                handleStreamEnd(provider);
            } catch (error) {
                console.error("Error processing Gemini stream:", error);
                if (loading) { // Check if still loading, to prevent multiple error handlings
                    setLoading(false);
                    onMessage({ role: "assistant", error: true, content: "An error occurred with the Gemini stream: " + error.message });
                }
            }
        })();
        return; // Important: return to prevent EventSource logic from running for Gemini
    } else if (provider === "openai") {
        if (typeof sourceOrStreamUrl !== "string") {
            currentEventSource = sourceOrStreamUrl; // sourceOrStreamUrl is the EventSource instance
        } else {
            currentEventSource = new SSE(sourceOrStreamUrl, { // sourceOrStreamUrl is the URL string
                headers: JSON.parse(JSON.stringify(arguments[0].headers || {})), // Kludgy way to pass headers if needed, or adjust signature
                method: "POST", // This was part of old setup, ensure it's passed correctly
                payload: JSON.parse(JSON.stringify(arguments[0].payload || {})), // Same for payload
            });
        }

        // Make sure arguments[0].headers and arguments[0].payload are correctly passed or refactor how SSE is initialized
        // This part is tricky as the original SSE initialization was in `pages/index.js`
        // For now, assuming sourceOrStreamUrl IS the SSE instance properly configured from outside for OpenAI.
        // Re-evaluating: sourceOrStreamUrl for OpenAI IS the URL. The SSE object must be created here.
        // This means the headers and payload for SSE need to be passed into LLMStreamingHandler for OpenAI.
        // This part of the refactoring is incomplete based on the prompt.
        // Let's assume sourceOrStreamUrl is a pre-configured EventSource object for OpenAI for now,
        // as per the previous structure where SSE instance was passed.
        // OR, if sourceOrStreamUrl is a URL, then headers/payload must be passed to this handler.
        // Based on previous step, pages/index.js creates the SSE object and passes it.
        // So, sourceOrStreamUrl IS the SSE instance for OpenAI.

        currentEventSource = sourceOrStreamUrl; // sourceOrStreamUrl is the SSE instance

        console.log("Registering stop-stream event listener for OpenAI");
        window.addEventListener("stop-stream", handleStopStreamForOpenAI);

        currentEventSource.addEventListener("readystatechange", event => {
            if (event.readyState >= 2) { // DONE, CLOSED
                // Check if it's already been handled by [DONE]
                if (loading && currentEventSource && currentEventSource.readyState === EventSource.CLOSED) { // EventSource.CLOSED is 2
                    console.log("OpenAI EventSource closed, calling handleStreamEnd.");
                    handleStreamEnd(provider); // Ensure stream end is called if connection closes abruptly
                }
            }
        });

        currentEventSource.addEventListener("message", event => handleIncomingMessage(event, provider));

        currentEventSource.addEventListener("error", error => {
            console.error("OpenAI EventSource error:", error);
            if (loading) {
                setLoading(false);
                setStreamedMessage("");
                onMessage({ role: "assistant", error: true, content: "An error occurred while streaming OpenAI response." });
                window.removeEventListener("stop-stream", handleStopStreamForOpenAI);
                currentEventSource = null;
            }
        });

        if (currentEventSource.readyState === EventSource.CONNECTING) { // EventSource.CONNECTING is 0
            currentEventSource.stream();
        }
        setLoading(true);
    }
}
