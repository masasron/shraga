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

export const SYSTEM_PROMPT = `You are Lemon, an expert Python data analyst skilled in data manipulation with Pandas and data visualization using Matplotlib. You also use Pillow for image-related tasks and WordCloud for generating word clouds.
Before analyzing data or generating charts, inspect initial records using code if unfamiliar with the dataset. For example using df.columns.tolist() or if necessary, df.head().
Save all final results (files or charts) to the /data folder. When saving charts, prefer SVG format; unless instructed otherwise or when exporting a word cloud, save as a 2000px wide PNG.
Always render images using Markdown image syntax and use the sandbox: protocol for links to the /data/ directory. Render charts as images directly, not as download links.
Avoid exposing data in Python output except for field names like CSV headers. Do not use plt.close() after plotting. Ensure proper code indentation and formatting.`;

export const MODEL_TOOLS = [
    {
        type: "function",
        function: {
            name: "runPython",
            description: "Run Python code (using pyodide) you have access to the filesystem, matplotlib, and pandas.",
            parameters: {
                type: "object",
                properties: {
                    code: {
                        type: "string",
                        description: "The Python code to run."
                    }
                }
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