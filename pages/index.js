import { SSE } from "sse.js";
import GlobalContext from 'GlobalContext';
import getMimeType from 'utils/getMimeType';
import { Settings2, Edit } from "lucide-react";
import UserMessage from "components/UserMessage";
import LoadingText from 'components/LoadingText';
import UserSettings from "components/UserSettings";
import ChatTextField from 'components/ChatTextField';
import { useContext, useState, useEffect } from 'react';
import AssistantMessage from "components/AssistantMessage";
import InteractiveChart from "components/InteractiveChart";
import LLMStreamingHandler from 'utils/LLMStreamingHandler';
import { MODELS, SYSTEM_PROMPT, MODEL_TOOLS } from 'utils/common';
import ChatLayout, { ChatContainer } from 'components/ChatLayout';

function Index() {
    const [files, setFiles] = useState([]);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [streamedMessage, setStreamedMessage] = useState("");
    const [isToolCallsStreaming, setIsToolCallsStreaming] = useState(false);
    const { isLoading, runPython, writeFile, deleteFile, pyodide, userSettings,
        setDrawerComponent, setDrawerIsOpen, setUserSettings
    } = useContext(GlobalContext);

    useEffect(function () {
        if (pyodide) {
            const dropArea = document.body;

            function handleDragover(e) {
                e.preventDefault();
            }

            function handleDrop(e) {
                e.preventDefault();
                handleFiles(e);
            }

            function handleDragleave(e) {
                e.preventDefault();
            }

            dropArea.addEventListener('dragover', handleDragover);
            dropArea.addEventListener('dragleave', handleDragleave);
            dropArea.addEventListener('drop', handleDrop);

            return function () {
                dropArea.removeEventListener('dragover', handleDragover);
                dropArea.removeEventListener('dragleave', handleDragleave);
                dropArea.removeEventListener('drop', handleDrop);
            }
        }
    }, [pyodide]);

    useEffect(function () {
        // listen for stream-tool-calls-done and stream-tool-calls events
        function handleStreamToolCalls() {
            setIsToolCallsStreaming(true);
        }

        function handleStreamToolCallsDone() {
            setIsToolCallsStreaming(false);
        }

        window.addEventListener("stream-tool-calls", handleStreamToolCalls);
        window.addEventListener("stream-tool-calls-done", handleStreamToolCallsDone);

        return function () {
            window.removeEventListener("stream-tool-calls", handleStreamToolCalls);
            window.removeEventListener("stream-tool-calls-done", handleStreamToolCallsDone);
        }
    }, []);

    function scrollDown() {
        setTimeout(() => {
            let container = document.getElementById("messages_container");
            container && container.scrollTo({
                top: container.scrollHeight,
                left: 0,
                behavior: "smooth",
            });
        }, 500);
    }

    function onMessage(message, isLast) {
        console.log('process message', message);
        setMessages(oldMessages => [...oldMessages, message]);

        scrollDown();

        if (message.role === 'tool' && isLast) {
            processMessages();
        }
    }

    async function runTool(toolName, args) {
        console.log('trying to run tool', toolName, args);

        if (toolName === "runPython") {
            try {
                return await runPython(args.code.trim());
            } catch (err) {
                let error = err.toString();
                console.log(error);
                if (error.indexOf("coroutine = eval(self.code, globals, locals)") !== -1) {
                    error = error.split("coroutine = eval(self.code, globals, locals)")[1];
                    if (error.indexOf("File ") !== -1) {
                        error = "File " + error.split("File ")[1];
                    }
                    error = error.trim();
                    return "PythonError: Traceback (most recent call last):\n" + error;
                }
                return error;
            }
        }

        return { error: "Tool not found" };
    }

    function processMessages() {
        setMessages(updatedMessages => {
            let url = "https://api.openai.com/v1/chat/completions", auth = `Bearer ${userSettings.openai_api_key}`;

            const messageHistory = [
                { role: "system", content: SYSTEM_PROMPT },
                ...updatedMessages.map(m => {
                    let msg = { role: m.role, content: m.content, tool_calls: m.tool_calls, tool_call_id: m.tool_call_id };
                    if (!msg.tool_calls) delete msg.tool_calls;
                    if (!msg.tool_call_id) delete msg.tool_call_id;
                    return msg;
                })
            ];

            const source = new SSE(url, {
                headers: {
                    "Authorization": auth,
                    "Content-Type": "application/json",
                },
                method: "POST",
                payload: JSON.stringify({
                    stream: true,
                    tools: MODEL_TOOLS,
                    messages: messageHistory,
                    model: userSettings.model,
                })
            });

            LLMStreamingHandler(source, onMessage, runTool, setStreamedMessage, setLoading);

            return updatedMessages;
        });
    }

    function handleMessage(message) {
        if (userSettings.openai_api_key === "") {
            // open user settings
            setDrawerComponent(<UserSettings />);
            setDrawerIsOpen(true);
            return false;
        }
        setFiles(uploaadedFiles => {
            if (uploaadedFiles.length === 0) return [];
            let newMessage = "<user files>\n";
            for (let file of uploaadedFiles) {
                newMessage += "/data/" + file.name + "\n";
            }
            newMessage += "</user files>\n";
            message = newMessage + "\n" + message;
            return [];
        });
        setMessages(oldMessages => [...oldMessages, { role: 'user', content: message }]);
        processMessages();
        scrollDown();
        return true;
    }

    function handleFileDelete(file) {
        setFiles(oldFiles => oldFiles.filter(f => f.name !== file.name));
        deleteFile(`/data/${file.name}`);
    }

    async function handleFiles(event) {
        const fileList = Array.from(event?.target?.files || event?.dataTransfer?.files);
        for (let file of fileList) {
            file.type_label = getMimeType(file.name).split("/")[1];
            file.status = 'loading';
            setFiles(oldFiles => [file, ...oldFiles]);
            await writeFile(file);
            file.status = 'done';
            setFiles(oldFiles => oldFiles.map(f => f.name === file.name ? file : f));
        }
    }

    function handleStop() {
        const event = new Event("stop-stream");
        window.dispatchEvent(event);
    }

    function handleChartRendering(event) {
        const elements = Array.from(document.querySelectorAll(".chart-preview"));

        let target = event.target;
        while (!elements.includes(target) && target !== document.body) {
            target = target.parentElement;
        }

        if (target === document.body) {
            console.error("Could not find the chart preview element");
            return;
        }

        let chartIndex = elements.indexOf(target);
        setDrawerComponent(<InteractiveChart chartIndex={chartIndex} />);
        setDrawerIsOpen(true);
    }

    function handleStartNewChat() {
        if (confirm("Are you sure you want to start a new chat?\nThis will clear the current chat history.")) {
            window.location.reload(true);
        }
    }

    function handleModelUpdate(e) {
        setUserSettings(oldSettings => {
            return {
                ...oldSettings,
                model: e.target.value
            }
        });
    }

    return <>
        {isLoading && <div className="flex items-center justify-center h-screen">
            <div className="relative">
                <LoadingText><img src="/lemon-top.svg" width="64" /></LoadingText>
            </div>
        </div>}
        {!isLoading && <>
            <ChatLayout
                header={<>
                    <select value={userSettings.model} onChange={handleModelUpdate} className="p-2 font-bold text-md hover:bg-gray-100 transition-colors rounded-lg">
                        {MODELS.map(model => <option key={model.value} value={model.value}>{model.name}</option>)}
                    </select>
                    <div className="flex-1" />
                    <button className="p-2 hover:bg-gray-100 rounded-lg" onClick={() => [setDrawerComponent(<UserSettings />), setDrawerIsOpen(true)]}>
                        <Settings2 size={20} />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-lg" onClick={handleStartNewChat}>
                        <Edit size={20} />
                    </button>
                </>}
                footer={<ChatContainer><ChatTextField onStop={handleStop} loading={loading} files={files} onFiles={handleFiles} onFileDelete={handleFileDelete} onMessage={handleMessage} placeholder={userSettings?.name ? `Hi ${userSettings.name}, how can I help?` : "Ask anything"} /></ChatContainer>}>
                {messages.length === 0 && <div className="flex flex-1 items-center h-[100%] justify-center">
                    <img src="/lemon-top.svg" width="64" />
                </div>}
                <ChatContainer>
                    {messages.map((message, i) => {
                        return ((message.role === "assistant" || message.role === "user") && message.content) ? <div key={i} className={`flex gap-2 ${message.role === 'assistant' ? 'justify-start' : 'justify-end'}`}>
                            <div className={`py-2 px-4 overflow-x-auto rounded-xl ${message.role === 'user' ? 'whitespace-break-spaces bg-gray-100' : 'text-black w-full bg-white'}`}>
                                {message.role === 'assistant' && <AssistantMessage messageIndex={i} messages={messages} onInteractiveChartRequest={handleChartRendering} content={message.content} />}
                                {message.role === 'user' && <UserMessage content={message.content} />}
                            </div>
                        </div> : null;
                    })}

                    {!isToolCallsStreaming && !streamedMessage && messages.length > 0 && (messages[messages.length - 1].role === 'tool' || messages[messages.length - 1].role === 'assistant' && messages[messages.length - 1].tool_calls) && <div className="flex gap-2 justify-start">
                        <LoadingText>Executing</LoadingText>
                    </div>}

                    {isToolCallsStreaming && <div className="flex gap-2 justify-start">
                        <LoadingText>Writing Python</LoadingText>
                    </div>}

                    {streamedMessage && <div className="flex gap-2 justify-start">
                        <div className="py-2 px-4 rounded-full text-black bg-white whitespace-break-spaces">
                            {streamedMessage} <div className="inline-block w-3 h-3 rounded-full bg-black" />
                        </div>
                    </div>}
                </ChatContainer>
            </ChatLayout>
        </>
        }
    </>
}

export default Index;