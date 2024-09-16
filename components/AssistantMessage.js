import remarkGfm from "remark-gfm";
import Tooltip from "components/Tooltip";
import GlobalContext from 'GlobalContext';
import { useContext, useState } from "react";
import { setUserClipboard } from "utils/common";
import parseToolsHistory from "utils/parseToolsHistory";
import CodeExecutionHistory from "components/CodeExecutionHistory";
import ReactMarkdown, { defaultUrlTransform } from "react-markdown";
import { Download, MousePointerClickIcon, SquareTerminal, CopyIcon, CheckIcon } from "lucide-react";

function AssistantMessage(props) {
    const [didCopy, setDidCopy] = useState(false);
    const { readFile, openInDrawer } = useContext(GlobalContext);

    const messages = props.messages;
    const onInteractiveChartRequest = props.onInteractiveChartRequest;

    const toolsHistory = parseToolsHistory(messages, props.messageIndex);

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
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = filenameFromSrc;
        a.click();
    }

    function handleCopy() {
        setUserClipboard(props.content, () => {
            setDidCopy(true);
            setTimeout(function () {
                setDidCopy(false);
            }, 1000);
        });
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
                                    <Tooltip content="Download" position="bottom">
                                        <button className="hover:bg-gray-100 p-1 rounded-lg" onClick={() => handleDownload(blobUrl, src)}><Download size={18} /></button>
                                    </Tooltip>
                                    <Tooltip content="Open chart" position="bottom-right">
                                        <button className="hover:bg-gray-100 p-1 rounded-lg hidden md:block" onClick={onInteractiveChartRequest}><MousePointerClickIcon size={18} /></button>
                                    </Tooltip>
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
            <div className="flex gap-2 pb-6">
                <Tooltip content="Copy" position="bottom-left">
                    <button className="p-1 rounded-md transition-opacity opacity-50 hover:opacity-100" onClick={handleCopy}>{didCopy ? <CheckIcon size={16} /> : <CopyIcon size={14} />}</button>
                </Tooltip>
                {toolsHistory.length > 0 && <Tooltip content="View source" position="bottom-left">
                    <button className="p-1 rounded-md transition-opacity opacity-50 hover:opacity-100" onClick={() => openInDrawer(<CodeExecutionHistory toolsHistory={toolsHistory} />)}><SquareTerminal size={14} /></button>
                </Tooltip>}
            </div>
        </div>
    </>
}

export default AssistantMessage;