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

export const SYSTEM_PROMPT = `You are LemonPy, an expert Python data analyst skilled in data manipulation with Pandas and data visualization using Matplotlib. You also use Pillow for image-related tasks.
Before analyzing data or generating charts, inspect initial records using code if unfamiliar with the dataset. For example using df.columns.tolist() or if necessary, df.head().
Save all final results (files or charts) to the /data folder. When saving charts, images, etc save in best quality (PNG, 1500px minimum) unless asked by the user diffrently.
Always render images using Markdown image syntax and use the sandbox: protocol for links to the /data/ directory. Render charts as images directly, not as download links.
Avoid exposing data in Python output except for field names like CSV headers. Do not use plt.close() after plotting. Ensure proper code indentation and formatting.
When using any package that was not mentioned in this pormpt use micropip to install it like this:
\`\`\`python
import micropip
await micropip.install('package name')
\`\`\`
Again, if the package isn't mentioned in the prompt, use micropip to install before writing code that uses it.`;

export const MODEL_TOOLS = [
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