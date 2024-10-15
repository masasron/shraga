import FileCard from "./FileCard";
import { CgAttachment } from "react-icons/cg";
import { ArrowUp, CircleStop } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import AutoResizedTextarea from "components/AutoResizeTextArea";

function ChatTextField(props) {
    const fileInputRef = useRef(null);
    const [value, setValue] = useState("");
    const [loading, setLoading] = useState(props.loading);

    useEffect(() => {
        setLoading(oldLoading => {
            if (oldLoading !== props.loading) {
                return props.loading;
            }
            return oldLoading;
        });
    }, [props.loading]);

    function handleKeyDown(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            emitMessage(value);
        }
    }

    function emitMessage(message) {
        message = message.trim();
        console.log("emit message", message, "loading=", loading);
        if (message === '' || loading) return;
        if (props.onMessage(message)) {
            setValue('');
        }
    }

    return <div className="w-full flex flex-col gap-2 bg-gray-100 p-2 rounded-[20px]">
        {props.files.length > 0 && <div className="flex gap-2 overflow-x-auto">
            {props.files.map(file => <FileCard key={file.unique_name} withPreview={true} file={file} onDelete={props.onFileDelete} />)}
        </div>}
        <div className='flex items-end px-1'>
            <button onClick={() => fileInputRef.current.click()} className='h-8 w-6 attachment-icon'>
                <CgAttachment size={20} />
            </button>
            <div className="flex-1 pb-1 flex items-center justify-center">
                <AutoResizedTextarea onKeyDown={handleKeyDown} value={value} onChange={e => setValue(e.target.value)} placeholder={props.placeholder} className="w-full overflow-y-auto max-h-[30vh] bg-transparent resize-none outline-none" />
            </div>
            <button
                onClick={() => (loading ? props.onStop() : emitMessage(value))}
                className={`bg-black text-white w-8 h-8 flex justify-center items-center rounded-full ${(loading || !value) ? 'opacity-20' : ''}`}
            >
                {!loading && <ArrowUp size={18} />}
                {loading && <CircleStop size={18} />}
            </button>
        </div>
        <input type="file" onChange={props.onFiles} ref={fileInputRef} multiple className="hidden" />
    </div>
}

export default ChatTextField;