import FileCard from "./FileCard";
import { useState, useEffect } from "react";

function getFileFromPath(path) {
    if (!window.files) {
        return null;
    }

    let fileName = path.split('/').pop();
    if (!window.files.has(fileName)) {
        return null;
    }

    let file = window.files.get(fileName);
    window.files.delete(fileName);
    return file;
}

export default function UserMessage(props) {
    let content = props.content;
    let [files, setFiles] = useState([]);

    if (content.indexOf("<user files>") === -1 || content.indexOf("</user files>") === -1) {
        return <>{props.content}</>
    }

    let filePaths = content.split("<user files>")[1].split("</user files>")[0].split('\n').filter(f => f.length > 0);
    content = content.split("</user files>")[1].trim();

    useEffect(() => {
        setFiles(filePaths.map(getFileFromPath));
    }, []);

    return <div className="flex flex-col gap-1">
        {files.length > 0 && (
            <div className="flex gap-2 overflow-x-auto">
                {files.map((file, i) => (
                    <FileCard key={i} canDelete={false} file={file} />
                ))}
            </div>
        )}
        <div>
            {content}
        </div>
    </div>
}