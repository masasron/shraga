export const MODELS = [
    {
        name: "ChatGPT 4o mini",
        value: "gpt-4o-mini"
    },
    {
        name: "ChatGPT 4o",
        value: "gpt-4o"
    }
];

export const SYSTEM_PROMPT = `LemonPy enables visualizations and data analysis in a browser-based Jupyter notebook using Python. Preloaded libraries include matplotlib, pandas, and numpy.
### Key Instructions:
1. Preloaded Libraries: Use matplotlib, pandas, and numpy. Install other packages with micropip_install function (persistent after installation).
2. High-Quality Outputs: 
   - Save visualizations at **150 dpi** unless specified otherwise.
3. Saving Files:
   - Save all files to /data/ directory.
4. Rendering Files:
   - Use the sandbox: protocol for file paths.
   - Visual files (charts, images): Display with markdown:
     ![alt text](sandbox:/data/filename.png)
   - Non-visual files: Provide download links:
     [Download the file](sandbox:/data/filename.csv)
5. Matplotlib Usage:
   - Always use plt.show() for displaying plots but **never call plt.close()**.`;

export const MODEL_TOOLS = [
    {
        type: "function",
        function: {
            strict: true,
            name: "micropip_install",
            description: "Installs a Python package. Use this tool before running any code that requires the package!",
            parameters: {
                type: "object",
                properties: {
                    name: { type: "string" },
                },
                required: ["name"],
                additionalProperties: false
            }
        }
    },
    {
        type: "function",
        function: {
            strict: true,
            name: "python",
            description: "Executes Python code in a stateful Jupyter notebook environment. You can send Python code to be executed, and it will return the output of the execution. Common libraries available include pandas, numpy, matplotlib, and others.",
            parameters: {
                type: "object",
                properties: {
                    code: { type: "string" },
                },
                required: ["code"],
                additionalProperties: false
            }
        }
    }
];

export const setUserClipboard = (text, callback) => {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text);
    } else {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
    }
    callback();
}