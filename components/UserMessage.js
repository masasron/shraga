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
        console.log("processing path", path)
        let fileName = path.split('/').pop();
        console.log("file name=>", fileName);
        if (!messageFiles.has(fileName)) {
            console.log("file not found", fileName);
            return null;
        }
        let file = messageFiles.get(fileName);
        console.log("file=>", file);
        messageFiles.delete(fileName);
        return file;
    }

    let filePaths = [];
    if (content.indexOf("<user files>") !== -1 && content.indexOf("</user files>") !== -1) {
        let isCSVData = false,
            filesData = content
                .split("<user files>")[1]
                .split("</user files>")[0]
                .split('\n')
                .filter(f => f.trim().length > 0);

        for (let row of filesData) {
            if (isCSVData) {
                if (row.endsWith("</csv>")) {
                    isCSVData = false;
                } else {
                    continue;
                }
            }
            if (row.startsWith("<csv>")) {
                isCSVData = true;
                continue;
            }
            filePaths.push(row);
        }
        content = content.split("</user files>")[1].trim();
    }

    useEffect(() => {
        console.log("filePaths=>", filePaths);
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
            <div
                className="py-2 px-4"
                ref={contentRef}
                style={
                    !showFullMessage && isOverflowing
                        ? { maxHeight: '60vh', overflow: 'hidden' }
                        : {}
                }
            >
                {content}
            </div>
            {files.length > 0 && (
                <div className="flex gap-2 overflow-x-auto px-2 pb-2">
                    {files.map((file, i) => (
                        <FileCard key={i} withPreview={true} canDelete={false} file={file} />
                    ))}
                </div>
            )}
            {isOverflowing && !showFullMessage && (
                <div>
                    <button className="font-bold text-sm underline" onClick={() => setShowFullMessage(true)}>Show full message</button>
                </div>
            )}
        </div>
    );
}