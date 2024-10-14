import {
    DrawerClose,
    DrawerHeader,
    DrawerTitle,
    DrawerFooter
} from "components/Drawer";
import Tooltip from "./Tooltip";
import Input from "components/Input";
import { MODELS } from "utils/common";
import GlobalContext from "GlobalContext";
import PasswordInput from "./PasswordInput";
import { CircleAlert, X } from "lucide-react";
import { useContext, useState, useEffect } from "react";

export default function UserSettings() {
    const { userSettings, setUserSettings } = useContext(GlobalContext);

    const [name, setName] = useState(userSettings.name || "");
    const [model, setModel] = useState(userSettings.model || "gpt-4o-mini");
    const [apiKey, setApiKey] = useState(userSettings.openai_api_key || "");

    useEffect(function () {
        setUserSettings({
            name,
            model,
            openai_api_key: apiKey
        });
    }, [name, apiKey, model]);

    return <div className="mx-auto text-left flex flex-col gap-2 text-base w-full max-w-3xl">
        <DrawerHeader>
            {!apiKey && <div className="border-[1px] text-sm mb-3 border-gray-200 rounded-lg p-3 flex items-center justify-center gap-3">
                <CircleAlert className="h-5 w-5" />
                <div className="flex flex-col">
                    <h4 className="font-medium">OpenAI API Key needed!</h4>
                    <p>
                        Pop one in, and we’ll be crunching data in no time!
                    </p>
                </div>
                <div className="flex-1" />
                <a href="https://platform.openai.com/api-keys" target="_blank" className="bg-slate-200 text-gray-800 font-medium px-2 border-[1px] py-1 rounded-lg mt-2 transition-colors inline-block hover:bg-slate-300" rel="noreferrer,noopener">Get API Key</a>
            </div>}

            <DrawerTitle className="text-left">
                Settings
            </DrawerTitle>

            <div className="flex gap-2 pt-5 text-left">
                <form className="flex gap-2 flex-col flex-1">
                    <label className="text-sm">Name</label>
                    <Input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="How should I call you?" />
                    <label className="text-sm mt-4">OpenAI API Key</label>
                    <PasswordInput error={!apiKey} placeholder="sk--********" value={apiKey} onChange={e => setApiKey(e.target.value)} defaultValue={userSettings.openai_api_key} />
                    <label className="text-sm mt-4">Model</label>
                    <select value={model} onChange={e => setModel(e.target.value)} className="border border-gray-300 pr-5 rounded-lg p-2 w-full">
                        {MODELS.map(model => <option key={model.value} value={model.value}>{model.name}</option>)}
                    </select>
                </form>
            </div>
        </DrawerHeader>
        <DrawerFooter className="items-center">
            <DrawerClose>
                <Tooltip content="Close" position="left">
                    <buttton className="p-2 rounded-lg hover:bg-gray-100 inline-block">
                        <X />
                    </buttton>
                </Tooltip>
            </DrawerClose>
        </DrawerFooter>
    </div>
}