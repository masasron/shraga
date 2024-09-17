import { Alert } from './Alert';
import GlobalContext from 'GlobalContext';
import { useContext, useState } from "react";
import { CopyIcon, CheckIcon, CircleAlert, Eye, EyeOff } from "lucide-react";
import { oneLight } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { PrismAsyncLight as SyntaxHighlighter } from "react-syntax-highlighter";

function CodeExecutionHistory(props) {
    const toolsHistory = props.toolsHistory;
    const { readFile } = useContext(GlobalContext);
    const [didCopy, setDidCopy] = useState(false);
    const [showErrors, setShowErrors] = useState(false);
    const [errorsCount, _] = useState(toolsHistory.filter(item => item.error === true).length);

    function handleCopy(code) {
        setUserClipboard(code, () => {
            setDidCopy(true);
            setTimeout(function () {
                setDidCopy(false);
            }, 1000);
        });
    }

    return <div className="mx-auto w-full max-h-[80vh] overflow-y-auto ">
        <div className="mb-3 text-sm w-full mx-auto max-w-[100vh] max-h-[80vh] whitespace-break-spaces">
            {errorsCount > 0 && <div className="p-2 justify-center flex">
                <Alert className="mr-2" variant="warning">
                    <div className='flex text-[13px] gap-2 justify-center'>
                        <CircleAlert size={18} />
                        <label>{errorsCount} error{errorsCount > 1 ? "s" : ""} accured during the execution. </label>
                        <div className='flex-1' />
                        <button className="flex gap-1 justify-center items-center" onClick={() => setShowErrors(!showErrors)}>
                            {showErrors ? "Hide" : "Show"}
                            {!showErrors ? <Eye size={14} /> : <EyeOff size={14} />}
                        </button>
                    </div>
                </Alert>
            </div>}
            {toolsHistory.map((item, index) => (item.error && !showErrors) ? null : <div className="flex flex-col" key={index}>
                <div>
                    <h1 className="p-2 text-slate-600">{item.function === "micropip_install" ? "Add dependency" : "Python"}</h1>
                    <div className="bg-white relative overflow-x-auto">
                        <SyntaxHighlighter language="python" style={oneLight}>{item.code}</SyntaxHighlighter>
                        <button className="absolute top-2 right-2 p-2" onClick={() => handleCopy(item.code)}>
                            {didCopy ? <CheckIcon size={16} /> : <CopyIcon size={16} />}
                        </button>
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

export default CodeExecutionHistory;