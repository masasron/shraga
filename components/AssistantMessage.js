import remarkGfm from "remark-gfm";
import GlobalContext from "GlobalContext";
import { useContext, useState } from "react";
import ReactMarkdown, { defaultUrlTransform } from "react-markdown";
import { Download, MousePointerClickIcon, SquareTerminal, CopyIcon, CheckIcon } from "lucide-react";

import { PrismAsyncLight as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight } from "react-syntax-highlighter/dist/cjs/styles/prism";

function functionCallsToCodeString(functionCalls) {
    let filteredFunctionCalls = functionCalls.filter(call => call.function && call.function.name === "runPython");
    return filteredFunctionCalls.reduce((acc, call) => {
        try {
            let { code } = JSON.parse(call.function.arguments);
            return acc + code;
        } catch (err) {
            console.warn("Error parsing function call", call, err);
            return acc;
        }
    }, "");
}

function CodeExecutionWidget(props) {
    const { readFile } = useContext(GlobalContext);
    const messageCodeAndToolOutput = props.messageCodeAndToolOutput;
    return <div className="mx-auto w-full">
        <div className="mb-3 text-sm w-full max-h-[90vh] overflow-hidden whitespace-break-spaces">
            {messageCodeAndToolOutput.map((item, i) => <div className="flex flex-col" key={i}>
                <div>
                    <h1 className="p-2 text-slate-600">Python Code</h1>
                    <div className="bg-white overflow-x-auto">
                        <SyntaxHighlighter language="python" style={oneLight}>{item.code}</SyntaxHighlighter>
                    </div>
                </div>
                {item.output && <div className="h-full flex flex-col">
                    <h1 className="p-2 text-slate-600">Result</h1>
                    <div className="whitespace-pre flex-1 text-[12px] bg-black text-white font-mono p-2 overflow-x-auto">
                        {item.output}
                        {item.output.startsWith("/data/") && item.output.match(/\.(svg|jpg|png|jpeg)$/) && <div className="p-2">
                            <img src={readFile(item.output)} className="max-w-[100%] w-auto mx-auto" />
                        </div>}
                    </div>
                </div>}
            </div>)}
        </div>
    </div>
}

function AssistantMessage(props) {
    const [didCopy, setDidCopy] = useState(false);
    const { readFile, openInDrawer } = useContext(GlobalContext);

    const messages = props.messages;
    const messageIndex = props.messageIndex;
    const onInteractiveChartRequest = props.onInteractiveChartRequest;

    const messageCodeAndToolOutput = [];

    // find the closes previos message with role "user"
    let userMessageIndex = messageIndex - 1;
    while (userMessageIndex >= 0 && messages[userMessageIndex].role !== "user") {
        userMessageIndex--;
    }

    // go over each message after messageIndex and check if it matches one of the following:
    // 1. role == "assistant" and has tool_calls property.
    // 2. role == "tool"
    for (let i = userMessageIndex + 1; i < messageIndex; i++) {
        let message = messages[i];
        if ((message.role === "assistant" && message.tool_calls) || message.role === "tool") {
            if (message.role === "assistant") {
                messageCodeAndToolOutput.push({ code: functionCallsToCodeString(message.tool_calls) });
            }
            if (message.role === "tool") {
                messageCodeAndToolOutput[messageCodeAndToolOutput.length - 1].output = message.content;
            }
        } else {
            break;
        }
    }


    const handleLinkClick = (e) => {
        e.preventDefault();
        const href = e.target.href;
        if (href.startsWith("sandbox:/")) {
            console.log("we should open a new tab here", href);
            let url = new URL(href);
            let path = url.pathname;
            let blobUrl = readFile(path);
            let fileName = path.split("/").pop();
            const a = document.createElement("a");
            a.href = blobUrl;
            a.download = fileName;
            a.click();
        } else {
            window.open(href, "_blank", "noopener,noreferrer");
        }
    }

    const customTransformLinkUri = (uri) => {
        return uri.startsWith('sandbox:') ? uri : defaultUrlTransform(uri);
    }

    const handleDownload = (blobUrl, src) => {
        const filenameFromSrc = src.split("/").pop().toLowerCase();
        console.log("handle download of", filenameFromSrc);
        // if .svg convert to png.
        if (filenameFromSrc.endsWith(".svg")) {
            console.log(".svg detected, converting to png.");
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            const img = new Image();
            img.onload = function () {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                const pngUrl = canvas.toDataURL("image/png");
                const a = document.createElement("a");
                a.href = pngUrl;
                a.download = filenameFromSrc.replaceAll(".svg", ".png");
                a.click();
            }
            img.src = blobUrl;
            return;
        }

        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = filenameFromSrc;
        a.click();
    }

    function handleCopy() {
        navigator.clipboard.writeText(props.content);
        setDidCopy(true);
        setTimeout(function () {
            setDidCopy(false);
        }, 1000);
    }

    return <>
        <div className="markdown-container">
            <ReactMarkdown
                children={props.content}
                remarkPlugins={[remarkGfm]}
                urlTransform={customTransformLinkUri}
                components={{
                    a: ({ node, inline, className, children, href, ...props }) => {
                        return !inline ? <a onClick={handleLinkClick} href={href} className={className} target="_blank" rel="nofollow noopener noreferrer" {...props}>{children}</a> : <span className={className} {...props}>{children}</span>
                    },
                    img: ({ node, inline, className, src, children, ...props }) => {
                        if (src.startsWith("sandbox:") || src.startsWith("/data/") || src.startsWith("data/")) {
                            if (src.startsWith("data/")) {
                                src = `/${src}`;
                            }
                            if (src.startsWith("/data/")) {
                                src = `sandbox:${src}`;
                            }
                            let blobUrl = "";
                            try {
                                let url = new URL(src);
                                let path = url.pathname;
                                blobUrl = readFile(path);
                            } catch {
                                console.log("error reading image as blob", src);
                            }
                            return <p className="chart-preview border-[1px] overflow-hidden border-gray-200 rounded-lg gap-1 flex flex-col">
                                <span className="flex p-2 gap-2">
                                    <span className="flex-1" />
                                    <button className="hover:bg-gray-100 p-1 rounded-lg" onClick={() => handleDownload(blobUrl, src)}><Download size={18} /></button>
                                    <button className="hover:bg-gray-100 p-1 rounded-lg hidden md:block" onClick={onInteractiveChartRequest}><MousePointerClickIcon size={18} /></button>
                                </span>
                                <span className="block items-center justify-center p-2">
                                    <img className="max-w-[100%] w-auto mx-auto" src={blobUrl} {...props} />
                                </span>
                            </p>
                        }
                        return <img className={className} {...props} />
                    }
                }}
            />
            <div className="flex gap-2">
                <a className="p-1 rounded-md opacity-50 hover:opacity-100" onClick={handleCopy}>{didCopy ? <CheckIcon size={16} /> : <CopyIcon size={14} />}</a>
                {messageCodeAndToolOutput.length > 0 && <a className="p-1 rounded-md opacity-50 hover:opacity-100" onClick={() => openInDrawer(<CodeExecutionWidget messageCodeAndToolOutput={messageCodeAndToolOutput} />)}><SquareTerminal size={14} /></a>}
            </div>
        </div>
    </>
}

export default AssistantMessage;