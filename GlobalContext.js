import {
    Drawer,
    DrawerContent,
} from "components/Drawer";
import getMimeType from 'utils/getMimeType';
import { createContext, useState, useEffect } from 'react';

const GlobalContext = createContext();

export const GlobalContextProvider = ({ children }) => {
    const [output, setOutput] = useState(null);
    const [pyodide, setPyodide] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [userSettings, setUserSettings] = useState({});
    const [drawerIsOpen, setDrawerIsOpen] = useState(false);
    const [messageFiles, setMessageFiles] = useState(new Map());
    const [drawerComponent, setDrawerComponent] = useState(null);

    useEffect(function () {
        if (userSettings?.model) {
            localStorage.setItem("userSettings", JSON.stringify(userSettings));
        }
    }, [userSettings]);

    function handleDrawerOpenChange(newOpenState) {
        setDrawerIsOpen(newOpenState);
        if (newOpenState === false) {
            setTimeout(() => setDrawerComponent(null), 500);
        }
    }

    function openInDrawer(component) {
        setDrawerComponent(component);
        setDrawerIsOpen(true);
    }

    useEffect(() => {
        const loadPyodideFromLocal = async () => {
            async function setupPyodide() {
                const pyodideInstance = await window.loadPyodide({
                    indexURL: '/pyodide/',
                });

                try {
                    pyodideInstance.FS.mkdir("/data");
                } catch (e) {
                    if (e.errno !== 17) {
                        // 17 = File exists
                        throw e;
                    }
                }

                document.pyodideMplTarget = document.createElement("div");
                document.pyodideMplTarget.id = "mpl-target";
                document.pyodideMplTarget.style = "position:fixed;top:0;left:0;width:0px;height:0px;opacity:0;overflow:hidden;z-index:-1;";
                document.body.appendChild(document.pyodideMplTarget);

                //await pyodideInstance.loadPackage(['matplotlib']);

                setPyodide(pyodideInstance);
                setIsLoading(false);
            }

            if (window.loadPyodide) {
                // If the loadPyodide function is already available on the window object, use it
                await setupPyodide();
                return;
            }

            try {
                const script = document.createElement('script');
                script.src = '/pyodide/pyodide.js';
                script.onload = async () => {
                    await setupPyodide();
                };
                script.onerror = () => {
                    console.error('Failed to load Pyodide from local files.');
                    setIsLoading(false);
                };
                document.body.appendChild(script);
            } catch (error) {
                console.error('Error loading Pyodide:', error);
                setIsLoading(false); // Set loading state to false in case of error
            }
        };
        if (!pyodide) {
            loadPyodideFromLocal();
        }
    }, [pyodide]);

    useEffect(function () {
        if (localStorage.userSettings) {
            setUserSettings(JSON.parse(localStorage.userSettings));
        } else {
            setUserSettings({
                name: "",
                model: "gpt-4o-mini",
                openai_api_key: ""
            });
        }
    }, []);

    function removeMatplotlib(code) {
        let lines = code.split('\n');
        let newCode = '';
        let inMatplotlib = false;
        for (let line of lines) {
            if (line.includes('import matplotlib')) {
                if (!window.didImportMatplotlib) {
                    window.didImportMatplotlib = true;
                    return code;
                }
                console.log("found matplotlib import, skipping");
                inMatplotlib = true;
            }
            if (!inMatplotlib) {
                newCode += line + '\n';
            }
        }
        return newCode;
    }

    const writeFile = file => {
        return new Promise((resolve, reject) => {
            if (!pyodide) {
                return reject('Pyodide not loaded yet');
            }
            const reader = new FileReader();
            reader.onload = function (event) {
                const arrayBuffer = event.target.result;
                const buffer = new Uint8Array(arrayBuffer);
                pyodide.FS.writeFile(`/data/${file.unique_name || file.name}`, buffer);
                resolve(`/data/${file.unique_name || file.name}`);
            };
            reader.readAsArrayBuffer(file);
        });
    }

    const readFile = (path, encoding = null) => {
        if (!pyodide) {
            throw new Error('Pyodide not loaded yet');
        }

        const bytes = pyodide.FS.readFile(path);
        const mimeType = getMimeType(path);

        if (encoding === "base64") {
            const chunkSize = 65536;
            let binaryString = '';
            for (let i = 0; i < bytes.length; i += chunkSize) {
                binaryString += String.fromCharCode.apply(null, bytes.slice(i, i + chunkSize));
            }
            const base64Data = btoa(binaryString);
            return {
                data: base64Data,
                mimeType
            };
        }

        const blob = new Blob([bytes], { type: mimeType });
        const url = URL.createObjectURL(blob);
        return url;
    }

    const deleteFile = path => {
        if (!pyodide) {
            throw new Error('Pyodide not loaded yet');
        }
        pyodide.FS.unlink(path);
    }

    const runPython = async (code) => {
        if (!pyodide) {
            throw new Error('Pyodide not loaded yet');
        }
        try {
            await pyodide.loadPackagesFromImports(removeMatplotlib(code));
            const result = await pyodide.runPythonAsync(code);
            if (result) {
                setOutput(result);
                return result.toString();
            }
            if (result === undefined) {
                console.log('result is undefined');
            }
            return "";
        } catch (error) {
            setOutput('Error running Python code');
            throw error;
        }
    };

    return (
        <GlobalContext.Provider value={{
            userSettings, setUserSettings, openInDrawer,
            drawerIsOpen, setDrawerIsOpen, drawerComponent, setDrawerComponent,
            pyodide, output, setOutput, deleteFile,
            isLoading, writeFile, readFile, runPython,
            messageFiles, setMessageFiles
        }}>
            {children}
            <Drawer open={drawerIsOpen} onOpenChange={handleDrawerOpenChange}>
                <DrawerContent className="bg-white overflow-hidden">
                    <div className='pt-5'></div>
                    {drawerComponent}
                </DrawerContent>
            </Drawer>
        </GlobalContext.Provider>
    );
};

export default GlobalContext;