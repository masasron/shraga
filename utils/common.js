export const MODELS = [
    {
        name: "GPT 4.1 Mini",
        value: "gpt-4.1-mini"
    },
    {
        name: "GPT 4.1 Nano",
        value: "gpt-4.1-nano"
    },
    {
        name: "GPT 4.1",
        value: "gpt-4.1"
    },
    {
        name: "o3",
        value: "o3"
    },
    {
        name: "o4 Mini",
        value: "o4-mini"
        // provider: "openai" // Assuming existing models without 'provider' are openai
    },
    // Gemini models are added below, placeholder removed.
    { name: "Gemini 2.0 Flash", value: "gemini-2.0-flash", provider: "gemini" },
    { name: "Gemini 2.5 Flash Preview", value: "gemini-2.5-flash-preview-05-20", provider: "gemini" },
    { name: "Gemini 2.0 Flash Lite", value: "gemini-2.0-flash-lite", provider: "gemini" },
    { name: "Gemini 2.5 Pro Preview", value: "gemini-2.5-pro-preview-05-06", provider: "gemini" }
];

export const SYSTEM_PROMPT = `You are Shraga, an expert AI data analyst. You can help with visualizations and data analysis of files, images, etc in a browser-based Jupyter notebook using Python and libraries like matplotlib, pandas, and numpy.
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
            name: "run_python",
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

// convertSchemaTypesToUpper is removed as prepareSchemaForGemini replaces its specific use case for Gemini tools
// and provides more comprehensive schema adjustments (e.g., removing additionalProperties).

export function prepareSchemaForGemini(schema) {
    // Handle null or non-object/array inputs gracefully
    if (!schema || typeof schema !== 'object') {
        return schema;
    }

    // Handle arrays (e.g., array of schemas in allOf, anyOf, oneOf, or items if items is an array of schemas)
    if (Array.isArray(schema)) {
        return schema.map(item => prepareSchemaForGemini(item));
    }

    // Create a new object to avoid modifying the original schema directly
    const newSchema = { ...schema };

    // 1. Convert 'type' property to uppercase if it's a string
    if (typeof newSchema.type === 'string') {
        newSchema.type = newSchema.type.toUpperCase();
    }

    // 2. Delete 'additionalProperties' property
    if (Object.prototype.hasOwnProperty.call(newSchema, 'additionalProperties')) {
        delete newSchema.additionalProperties;
    }

    // 3. Recursively call for nested schema objects
    const keysToRecurse = ['properties', 'items', 'allOf', 'anyOf', 'oneOf'];
    for (const key of keysToRecurse) {
        if (newSchema[key]) {
            if (key === 'properties' || (key === 'items' && typeof newSchema.items === 'object' && !Array.isArray(newSchema.items))) {
                // For 'properties' (object of schemas) and 'items' (single schema object)
                const nestedObject = newSchema[key];
                const newNestedObject = {};
                for (const propName in nestedObject) {
                    if (Object.prototype.hasOwnProperty.call(nestedObject, propName)) {
                        newNestedObject[propName] = prepareSchemaForGemini(nestedObject[propName]);
                    }
                }
                newSchema[key] = newNestedObject;
            } else if (Array.isArray(newSchema[key])) {
                // For 'items' (if it's an array of schemas, though less common for 'items' itself),
                // 'allOf', 'anyOf', 'oneOf' (array of schemas)
                newSchema[key] = newSchema[key].map(itemSchema => prepareSchemaForGemini(itemSchema));
            }
            // If 'items' is a single schema object, it's handled above.
            // If 'items' is an array of schemas (less common for 'items', more for 'prefixItems'),
            // the Array.isArray(schema) check at the beginning handles it if schema itself is that array.
            // This logic specifically targets object/array properties that contain schemas.
        }
    }

    // Handle patternProperties if present (similar to properties)
    if (newSchema.patternProperties) {
        const newPatternProps = {};
        for (const propName in newSchema.patternProperties) {
            if (Object.prototype.hasOwnProperty.call(newSchema.patternProperties, propName)) {
                newPatternProps[propName] = prepareSchemaForGemini(newSchema.patternProperties[propName]);
            }
        }
        newSchema.patternProperties = newPatternProps;
    }

    return newSchema;
}
