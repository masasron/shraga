import {
    DrawerClose,
    DrawerHeader,
    DrawerTitle,
    DrawerFooter
} from "components/Drawer";
import Input from "components/Input";
import GlobalContext from "GlobalContext";
import PasswordInput from "./PasswordInput";
import { CircleAlert, X } from "lucide-react";
import { useContext, useState, useEffect } from "react";
import {
    Alert,
    AlertDescription,
    AlertTitle,
} from "components/Alert";
import { MODELS } from "utils/common";

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
            {!apiKey && <Alert className="mb-5 text-left" variant="destructive">
                <CircleAlert className="h-4 w-4" />
                <AlertTitle>OpenAI API Key is missing</AlertTitle>
                <AlertDescription>
                    You need to provide an OpenAI API Key to use the assistant.
                </AlertDescription>
            </Alert>}

            <DrawerTitle className="text-left">
                Settings
            </DrawerTitle>

            <div className="flex gap-2 pt-5 text-left">
                <form className="flex gap-2 flex-col flex-1">
                    <label className="text-sm">Name</label>
                    <Input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="How should we call you?" />
                    <label className="text-sm mt-4">OpenAI API Key</label>
                    <PasswordInput placeholder="sk--********" value={apiKey} onChange={e => setApiKey(e.target.value)} defaultValue={userSettings.openai_api_key} />
                    <label className="text-sm mt-4">Model</label>
                    <select value={model} onChange={e => setModel(e.target.value)} className="border border-gray-300 pr-5 rounded-lg p-2 w-full">
                        {MODELS.map(model => <option key={model.value} value={model.value}>{model.name}</option>)}
                    </select>
                </form>
            </div>
        </DrawerHeader>
        <DrawerFooter className="items-center">
            <DrawerClose>
                <buttton title="Close" className="p-1 rounded-lg hover:bg-gray-100 inline-block">
                    <X />
                </buttton>
            </DrawerClose>
        </DrawerFooter>
    </div>
}