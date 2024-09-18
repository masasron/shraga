import { SSE } from "sse.js";
import Tooltip from "components/Tooltip";
import GlobalContext from 'GlobalContext';
import getMimeType from 'utils/getMimeType';
import UserMessage from "components/UserMessage";
import LoadingText from 'components/LoadingText';
import UserSettings from "components/UserSettings";
import ChatTextField from 'components/ChatTextField';
import { useContext, useState, useEffect } from 'react';
import parseToolsHistory from "utils/parseToolsHistory";
import { Settings2, Edit, Download, Github } from "lucide-react";
import AssistantMessage from "components/AssistantMessage";
import InteractiveChart from "components/InteractiveChart";
import OnboardingDialog from "components/OnboardingDialog";
import LLMStreamingHandler from 'utils/LLMStreamingHandler';
import { MODELS, SYSTEM_PROMPT, MODEL_TOOLS } from 'utils/common';
import ChatLayout, { ChatContainer } from 'components/ChatLayout';
import exportAsJuptyerNotebook from 'utils/exportAsJuptyerNotebook';

function Index() {
    const [files, setFiles] = useState([]);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [streamedMessage, setStreamedMessage] = useState("");
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [isToolCallsStreaming, setIsToolCallsStreaming] = useState(false);
    const { isLoading, runPython, writeFile, readFile, deleteFile, pyodide, userSettings, setUserSettings, openInDrawer } = useContext(GlobalContext);

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

            dropArea.addEventListener('drop', handleDrop);
            dropArea.addEventListener('dragover', handleDragover);
            dropArea.addEventListener('dragleave', handleDragleave);

            return function () {
                dropArea.removeEventListener('drop', handleDrop);
                dropArea.removeEventListener('dragover', handleDragover);
                dropArea.removeEventListener('dragleave', handleDragleave);
            }
        }
    }, [pyodide]);

    useEffect(function () {
        if (!isLoading) {
            let timeout = setTimeout(() => {
                setShowOnboarding(localStorage.getItem("onboarded") !== "1");
            }, 1500);
            return function () {
                clearTimeout(timeout);
            }
        }
    }, [isLoading]);

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

    function handleExport(messages) {
        const cells = exportAsJuptyerNotebook(messages, { readFile, parseToolsHistory });
        const json = JSON.stringify({ cells });
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = new Date().getTime() + "-notebook.ipynb";
        a.click();
    }

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
        console.log('>>> Running tool:', toolName, args);

        if (toolName === "micropip_install") {
            const packageName = args.name;
            try {
                await pyodide.runPythonAsync(`import micropip; micropip.install('${packageName}')`);
                return "success";
            } catch (err) {
                return "This package does not exist or could not be installed";
            }
        }

        if (toolName === "python") {
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
                    return "PythonError: " + error;
                }
                return error;
            }
        }

        return "Tool not found";
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
            openInDrawer(<UserSettings />);
            return false;
        }

        window.files = new Map();

        setFiles(uploaadedFiles => {
            if (uploaadedFiles.length === 0) return [];
            let newMessage = "<user files>\n";
            for (let file of uploaadedFiles) {
                newMessage += "/data/" + file.unique_name + "\n";
                window.files.set(file.unique_name, file);
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
        setFiles(oldFiles => oldFiles.filter(f => f.unique_name !== file.unique_name));
        deleteFile(`/data/${file.unique_name}`);
    }

    function fileNameExists(name) {
        return new Promise((resolve, _) => {
            setFiles(oldFiles => {
                let fileNameAlreadyExists = oldFiles.find(f => f.unique_name === name);
                resolve(fileNameAlreadyExists);
                return oldFiles;
            });
        });
    }

    async function handleFiles(event) {
        const fileList = Array.from(event?.target?.files || event?.dataTransfer?.files);
        for (let file of fileList) {
            let name = file.name;
            let index = 1;
            while (await fileNameExists(name)) {
                name = `copy-${index}-${file.name}`;
                index++;
            }
            file.unique_name = name;
            file.type_label = getMimeType(file.name).split("/")[1];
            file.status = 'loading';
            setFiles(oldFiles => [file, ...oldFiles]);
            await writeFile(file);
            file.status = 'done';
            setFiles(oldFiles => oldFiles.map(f => f.unique_name === file.unique_name ? file : f));
        }
        // clear file input
        if (event.target) {
            event.target.value = "";
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

        openInDrawer(<InteractiveChart chartIndex={chartIndex} />);
    }

    function handleStartNewChat() {
        if (messages.length === 0 || confirm("Are you sure you want to start a new chat?\nThis will clear the current chat history.")) {
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

    function handleOnboardingClose() {
        setShowOnboarding(false);
        localStorage.setItem("onboarded", "1");
    }

    return <>
        {(isLoading || messages.length === 0) && <div className="fixed top-0 left-0 w-full h-full">
            <div className="flex h-full items-center justify-center">
                <div className="spin-and-scale">
                    <LoadingText><img src="/lemon-top-black.svg" width="64" /></LoadingText>
                </div>
            </div>
        </div>}
        {!isLoading && <>
            {showOnboarding && <OnboardingDialog onClose={handleOnboardingClose} />}
            <ChatLayout
                header={<>
                    <select value={userSettings.model} onChange={handleModelUpdate} className="p-2 font-bold text-md hover:bg-gray-100 transition-colors rounded-lg">
                        {MODELS.map(model => <option key={model.value} value={model.value}>{model.name}</option>)}
                    </select>
                    <div className="flex-1" />
                    {messages.length > 1 && <Tooltip content="Export as Jupyter Notebook" position="bottom">
                        <button className="p-2 hover:bg-gray-100 rounded-lg" onClick={() => handleExport(messages)}>
                            <Download size={20} />
                        </button>
                    </Tooltip>}
                    <Tooltip content="Settings" position="bottom">
                        <button className="p-2 hover:bg-gray-100 rounded-lg" onClick={() => openInDrawer(<UserSettings />)}>
                            <Settings2 size={20} />
                        </button>
                    </Tooltip>
                    <Tooltip content="New chat" position="bottom">
                        <button className="p-2 hover:bg-gray-100 rounded-lg" onClick={handleStartNewChat}>
                            <Edit size={20} />
                        </button>
                    </Tooltip>
                    <Tooltip content="Lemon on Github" position="bottom-right">
                        <button className="p-2 hover:bg-gray-100 rounded-lg" onClick={() => window.open("https://github.com/masasron/lemon", "_blank")}>
                            <Github size={20} />
                        </button>
                    </Tooltip>
                </>}
                footer={<ChatContainer><ChatTextField onStop={handleStop} loading={loading} files={files} onFiles={handleFiles} onFileDelete={handleFileDelete} onMessage={handleMessage} placeholder={userSettings?.name ? `Hi ${userSettings.name}, how can I help?` : "Ask anything"} /></ChatContainer>}>
                <ChatContainer>
                    {messages.map((message, i) => {
                        return ((message.role === "assistant" || message.role === "user") && message.content) ? <div key={i} className={`flex gap-2 ${message.role === 'assistant' ? 'justify-start' : 'justify-end'}`}>
                            <div className={`py-2 px-4 overflow-x-auto rounded-xl ${message.role === 'user' ? 'whitespace-break-spaces bg-gray-100 rounded-br-none' : 'text-black w-full bg-white'}`}>
                                {message.role === 'assistant' && <AssistantMessage messageIndex={i} messages={messages} onInteractiveChartRequest={handleChartRendering} content={message.content} />}
                                {message.role === 'user' && <UserMessage content={message.content} />}
                            </div>
                        </div> : null;
                    })}

                    {streamedMessage && <div className="flex gap-2 justify-start">
                        <div className="py-2 px-4 rounded-full text-black bg-white whitespace-break-spaces">
                            {streamedMessage} <div className="inline-block w-3 h-3 rounded-full bg-black" />
                        </div>
                    </div>}

                    {!isToolCallsStreaming && !streamedMessage && messages.length > 0 && (messages[messages.length - 1].role === 'tool' || messages[messages.length - 1].role === 'assistant' && messages[messages.length - 1].tool_calls) && <div className="flex gap-2 justify-start">
                        <LoadingText>Executing</LoadingText>
                    </div>}

                    {isToolCallsStreaming && <div className="flex gap-2 justify-start">
                        <LoadingText>Writing Python</LoadingText>
                    </div>}

                    {messages.length > 0 && <div className="h-[100px]" />}
                </ChatContainer>
            </ChatLayout>
        </>
        }
    </>
}

export default Index;