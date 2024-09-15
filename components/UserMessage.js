import FileCard from "./FileCard";
import getMimeType from "utils/getMimeType";

function makeFakeFileFromPath(path) {
    let parts = path.split('/');
    let name = parts[parts.length - 1];
    let type = getMimeType(name);
    let type_label = type.split('/')[1];
    return { name, type, type_label, status: 'done' };
}

export default function UserMessage(props) {
    let content = props.content;
    // detect <user files> and </user files> and replace each file path inside with a FileCard

    if (content.indexOf("<user files>") === -1 || content.indexOf("</user files>") === -1) {
        return <>{props.content}</>
    }

    let files = content.split("<user files>")[1].split("</user files>")[0].split('\n').filter(f => f.length > 0);
    content = content.split("</user files>")[1].trim();

    return <div className="flex flex-col gap-1">
        {files.length > 0 && (
            <div className="flex gap-2 overflow-x-auto">
                {files.map((filePath, i) => (
                    <FileCard key={i} canDelete={false} file={makeFakeFileFromPath(filePath)} />
                ))}
            </div>
        )}
        <div>
            {content}
        </div>
    </div>
}