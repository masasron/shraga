import { useState } from "react";
import { ArrowRight } from "lucide-react";

export default function OnboardingDialog(props) {
    const [step, setStep] = useState(0);

    const screens = [
        {
            icon: "/lock.svg",
            title: "Private Data Analysis",
            description: <><strong className="text-black">Lemon</strong> lets you use GPT-4o for data analysis, visualization, and programming directly in your browser. All computations run locally via <a className="underline" href="https://pyodide.org/en/stable/" target="_blank">Pyodide</a> without sharing your files <strong className="text-black">with anyone</strong>. </>,
            buttonText: <>Get Started <ArrowRight size={15} /></>
        }
    ];

    return <>
        <div className="w-full h-full fixed top-0 left-0 bg-black bg-opacity-50 z-50 fade-in"></div>
        <div className="w-96 h-96 rounded-3xl bg-white fixed fade-in-and-scale top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
            <div className="p-6 flex flex-col gap-2 h-full">
                <div className="flex items-center justify-center">
                    <img src={screens[step].icon} width="142" />
                </div>
                <h1 className="text-2xl text-center font-bold">{screens[step].title}</h1>
                <p className="text-[15px] text-gray-600 text-center">{screens[step].description}</p>
                <div className="flex flex-grow justify-center items-center">
                    <button className="bg-black text-white gap-2 items-center justify-center flex px-4 py-2 rounded-md" onClick={() => {
                        if (step < screens.length - 1) {
                            setStep(step + 1);
                        } else {
                            props.onClose();
                        }
                    }}>{screens[step].buttonText}</button>
                </div>
            </div>
        </div>
    </>
}