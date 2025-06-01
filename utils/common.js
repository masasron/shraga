export const MODELS = [
    {
        name: "gpt-4.1-mini",
        value: "gpt-4.1-mini"
    },
    {
        name: "gpt-4.1-nano",
        value: "gpt-4.1-nano"
    },
    {
        name: "gpt-4.1",
        value: "gpt-4.1"
    },
    {
        name: "o3",
        value: "o3"
    },
    {
        name: "o4-mini",
        value: "o4-mini"
    },
    {
        name: "Gemini Pro",
        value: "gemini-pro",
        provider: "gemini"
    }
];

export const SYSTEM_PROMPT = `You are Shraga, an expert AI data analyst. You can help with visualizations and data analysis in a browser-based Jupyter notebook using Python and libraries like matplotlib, pandas, and numpy.
### Key Instructions:
1. High-Quality Outputs: 
   - Save visualizations at **150 dpi** unless specified otherwise.
2. Saving Files:
   - Save all files to /data/ directory.
3. Rendering Files:
   - Use the sandbox: protocol for file paths.
   - Visual files (charts, images): Display with markdown:
     ![alt text](sandbox:/data/filename.png)
   - Non-visual files: Provide download links:
     [Download the file](sandbox:/data/filename.csv)
4. Matplotlib Usage:
   - Always use plt.show() for displaying charts but **never call plt.close()**.`;

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

export function convertSchemaTypesToUpper(schema) {
    if (!schema || typeof schema !== 'object') return schema;
    const newSchema = Array.isArray(schema) ? [] : {}; // Handle arrays and objects
    for (const key in schema) {
        if (Object.prototype.hasOwnProperty.call(schema, key)) { // Ensure own properties
            if (key === 'type' && typeof schema[key] === 'string') {
                newSchema[key] = schema[key].toUpperCase();
            } else {
                // Recursively call for nested objects/arrays
                newSchema[key] = convertSchemaTypesToUpper(schema[key]);
            }
        }
    }
    return newSchema;
}
