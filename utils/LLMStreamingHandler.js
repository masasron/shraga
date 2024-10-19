export default function LLMStreamingHandler(source, onMessage, runTool, setStreamedMessage, setLoading) {
    let toolCalls = [];

    async function handleIncomingMessage(event) {
        if (event.data.trim() === "[DONE]") {
            setStreamedMessage(content => {
                setLoading(false);
                let msg = { role: "assistant", content };
                if (toolCalls.length > 0) {
                    msg.tool_calls = toolCalls;
                    // dispatch event about the fact that tool calls are done streaming
                    const event = new CustomEvent("stream-tool-calls-done");
                    window.dispatchEvent(event);
                }
                onMessage(msg);
                (async () => {
                    for (let toolCall of toolCalls) {
                        let isLast = toolCalls.indexOf(toolCall) === toolCalls.length - 1;
                        let args = JSON.parse(toolCall.function.arguments);
                        let result = await runTool(toolCall.function.name, args);
                        onMessage({ role: "tool", content: result, tool_call_id: toolCall.id }, isLast);
                    }
                })();
                return "";
            });

            console.log("removed stop-stream event listener");
            window.removeEventListener("stop-stream", handleStopStream);
            return source.close();
        }

        const payload = JSON.parse(event.data);
        const text = payload?.choices[0]?.delta?.content;

        if (text) {
            setStreamedMessage(oldMsg => {
                if (oldMsg === "" && text.trim() === "") {
                    return "";
                }
                return oldMsg + text;
            });
        }

        const tool_calls = payload?.choices[0]?.delta?.tool_calls;
        if (tool_calls) {
            const event = new CustomEvent("stream-tool-calls");
            window.dispatchEvent(event);
            for (let tool_call of tool_calls) {
                if (tool_call.id) {
                    toolCalls.push(tool_call);
                } else {
                    if (tool_call.function.arguments) {
                        toolCalls[tool_call.index].function.arguments += tool_call.function.arguments;
                    }
                }
            }
        }
    }

    function handleStopStream() {
        source.close();
        setLoading(false);

        console.log("removed stop-stream event listener");
        window.removeEventListener("stop-stream", handleStopStream);

        // Add the streamed message to the chat
        setStreamedMessage(content => {
            setLoading(false);
            let msg = { role: "assistant", content };
            content && onMessage(msg);
            return "";
        });
    }

    console.log("registering stop-stream event listener");
    window.addEventListener("stop-stream", handleStopStream);

    source.addEventListener("readystatechange", event => {
        if (event.readyState >= 2) {
            console.log("settings is loading to false");
            setLoading(false);
        }
    });

    source.addEventListener("message", handleIncomingMessage);

    source.addEventListener("error", error => {
        console.log(error);
        setLoading(false);
        setStreamedMessage("");
        onMessage({ role: "assistant", error: true, content: "An error occurred while streaming the response." });
    });

    if (source.readyState === -1) {
        source.stream();
    }

    setLoading(true);
}
