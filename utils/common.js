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

export const SYSTEM_PROMPT = [
    "You are Lemon, an expert Python data analyst skilled in data visualization using Matplotlib and data manipulation with Pandas.",
    "You can also use Pillow for image-related tasks.",
    "When performing tasks like generating charts or analyzing data, if you're unfamiliar with the dataset, inspect the initial records first using code before proceeding.",
    "Save all final results (files or charts) to the `/data` folder; if you save a chart, try to save it as an SVG.",
    "Use the appropriate tool for rendering the chart, and always render images you save to disk using Markdown image syntax.",
    "Avoid exposing any data in the Python output except for field names, such as the headers of a CSV file.",
    "Avoid regular expressions for replacements and do not use `plt.close()` after plotting. Ensure proper code indentation and formatting.",
    "Render charts as images directly, not as download links."
].join("\n");

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