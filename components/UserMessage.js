import FileCard from "./FileCard";
import GlobalContext from "GlobalContext";
import { useState, useEffect, useContext, useRef } from "react";

export default function UserMessage(props) {
    let content = props.content;
    let [files, setFiles] = useState([]);
    let { messageFiles } = useContext(GlobalContext);

    const contentRef = useRef(null);
    const [showFullMessage, setShowFullMessage] = useState(false);
    const [isOverflowing, setIsOverflowing] = useState(false);

    function getFileFromPath(path) {
        let fileName = path.split('/').pop();
        if (!messageFiles.has(fileName)) {
            return null;
        }
        let file = messageFiles.get(fileName);
        messageFiles.delete(fileName);
        return file;
    }

    let filePaths = [];
    if (content.indexOf("<user files>") !== -1 && content.indexOf("</user files>") !== -1) {
        filePaths = content
            .split("<user files>")[1]
            .split("</user files>")[0]
            .split('\n')
            .filter(f => f.length > 0);
        content = content.split("</user files>")[1].trim();
    }

    useEffect(() => {
        setFiles(filePaths.map(getFileFromPath));
    }, []);

    useEffect(() => {
        if (contentRef.current) {
            const contentHeight = contentRef.current.offsetHeight;
            const windowHeight = window.innerHeight;
            const maxHeight = 0.55 * windowHeight;
            if (contentHeight > maxHeight) {
                setIsOverflowing(true);
            } else {
                setIsOverflowing(false);
            }
        }
    }, [content, files]);

    return (
        <div className="flex flex-col gap-1">
            {files.length > 0 && (
                <div className="flex gap-2 overflow-x-auto">
                    {files.map((file, i) => (
                        <FileCard key={i} canDelete={false} file={file} />
                    ))}
                </div>
            )}
            <div
                ref={contentRef}
                style={
                    !showFullMessage && isOverflowing
                        ? { maxHeight: '60vh', overflow: 'hidden' }
                        : {}
                }
            >
                {content}
            </div>
            {isOverflowing && !showFullMessage && (
                <div>
                    <button className="font-bold text-sm underline" onClick={() => setShowFullMessage(true)}>Show full message</button>
                </div>
            )}
        </div>
    );
}