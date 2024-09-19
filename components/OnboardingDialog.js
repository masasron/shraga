import { useState, useEffect } from "react";
import { ArrowRight } from "lucide-react";
import SharagaLottie from "./ShrageLottie";
import LoadingText from "./LoadingText";
export default function OnboardingDialog(props) {
    const [stopAnimation, setStopAnimation] = useState(1);
    useEffect(function () {
        setTimeout(() => setStopAnimation(null), 2000);
    }, []);

    return <>
        <div className="w-full h-full fixed top-0 left-0 bg-black bg-opacity-50 z-50 fade-in"></div>
        <div className="w-[95%] h-[95%] max-w-[80vh] max-h-[80vh] rounded-3xl bg-white fixed fade-in-and-scale top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
            <div className="flex overflow-hidden flex-col h-full">
                <div className="px-10 pt-8 text-left pb-0 flex flex-col gap-2">
                    <h1 className="text-3xl font-bold">
                        Hi, I’m Shraga 👋
                    </h1>
                    <p style={{ lineHeight: "30px" }} className="text-left text-lg text-gray-700">
                        I’m here to help with data analysis, visualization, and coding. And while I am powered by ChatGPT, all file processing happens locally, right in your browser using <a className="underline" href="https://pyodide.org/en/stable/" target="_blank">Pyodide</a>, so your files stay completely private. <strong className="text-black">Let’s get to work!</strong>
                    </p>
                </div>
                <div className="flex flex-grow justify-center items-center pt-5">
                    <LoadingText stop={stopAnimation} onClick={props.onClose} className="inline-block overflow-hidden">
                        <button className="bg-black font-bold text-lg text-white gap-2 items-center justify-center flex px-8 py-4 rounded-md">Get Started <ArrowRight size={18} /></button>
                    </LoadingText>
                </div>
                <SharagaLottie />
            </div>
        </div >
    </>
}