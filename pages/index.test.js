// This file will focus on testing logic from pages/index.js,
// particularly the mapping functions for Gemini.
import {
    MODEL_TOOLS as actualModelToolsFromSource, // Keep original for potential other tests
    prepareSchemaForGemini as actualPrepareSchemaForGemini // Import the new function
} from '../utils/common';

// Mock parts of GlobalContext that might be relevant if we were testing the full component
const mockUserSettings = {
  provider: 'gemini',
  gemini_api_key: 'test-gemini-key',
  model: 'gemini-pro',
};

// Helper function to simulate message mapping logic (remains unchanged from previous version)
const mapMessagesToGeminiContentsForTesting = (messages) => {
  return messages
    .filter(msg => msg.role !== "system" && !msg.error)
    .map(msg => {
      if (msg.role === "user") {
        return { role: "user", parts: [{ text: msg.content }] };
      } else if (msg.role === "assistant") {
        if (msg.tool_calls && msg.tool_calls.length > 0) {
          return {
            role: "model",
            parts: msg.tool_calls.map(tc => ({
              functionCall: {
                name: tc.function.name,
                args: JSON.parse(tc.function.arguments)
              }
            }))
          };
        }
        return { role: "model", parts: [{ text: msg.content }] };
      } else if (msg.role === "tool") {
        return {
          role: "function",
          parts: [{
            functionResponse: {
              name: msg.tool_call_id,
              response: {
                name: msg.tool_call_id,
                content: msg.content
              }
            }
          }]
        };
      }
      return null;
    }).filter(Boolean);
};

// Updated Helper function to simulate tool mapping logic using prepareSchemaForGemini
const mapToolsToGeminiDeclarationsForTesting = (tools) => {
  return tools.map(tool => ({
    name: tool.function.name,
    description: tool.function.description,
    // Use the actual prepareSchemaForGemini function
    parameters: tool.function.parameters ? actualPrepareSchemaForGemini(tool.function.parameters) : undefined
  }));
};

// Updated Mock MODEL_TOOLS for testing prepareSchemaForGemini effects
const mockModelToolsForGeminiTest = [
  {
    type: "function",
    function: {
      name: "python",
      description: "Executes Python code...",
      parameters: {
        type: "object",
        properties: { code: { type: "string", description: "python code" } },
        required: ["code"],
        additionalProperties: false // This should be removed
      }
    }
  },
  {
    type: "function",
    function: {
      name: "test_tool_with_schema_props",
      description: "A test tool with various schema properties.",
      parameters: {
        type: "object",
        properties: {
          propA: { type: "string", description: "Property A" },
          nestedObj: {
            type: "object",
            properties: {
              propB: { type: "integer" },
              propC: { type: "boolean", description: "Property C" }
            },
            required: ["propB"],
            additionalProperties: false // This should be removed
          },
          simpleArray: {
            type: "array",
            items: { type: "string" },
            additionalProperties: true // This should be removed (if items is object) or ignored (if items is not object)
                                      // `additionalProperties` is typically for objects.
          }
        },
        required: ["propA", "nestedObj"],
        additionalProperties: true // This should be removed
      }
    }
  },
  {
    type: "function",
    function: {
        name: "tool_without_params",
        description: "A tool that takes no parameters."
        // no parameters property
    }
  }
];


describe('pages/index.js logic for Gemini', () => {

  describe('mapMessagesToGeminiContents (Simulated)', () => {
    // This test suite remains unchanged as it doesn't involve schema transformation.
    // (Copied from previous version for completeness)
    it('should map user messages correctly', () => {
      const messages = [{ role: 'user', content: 'Hello there' }];
      const expected = [{ role: 'user', parts: [{ text: 'Hello there' }] }];
      expect(mapMessagesToGeminiContentsForTesting(messages)).toEqual(expected);
    });

    it('should map assistant text messages correctly', () => {
      const messages = [{ role: 'assistant', content: 'Hi, how can I help?' }];
      const expected = [{ role: 'model', parts: [{ text: 'Hi, how can I help?' }] }];
      expect(mapMessagesToGeminiContentsForTesting(messages)).toEqual(expected);
    });

    it('should filter out system messages', () => {
      const messages = [{ role: 'system', content: 'You are an AI.' }];
      expect(mapMessagesToGeminiContentsForTesting(messages)).toEqual([]);
    });

    it('should map assistant tool_calls to functionCall parts', () => {
      const messages = [{
        role: 'assistant',
        tool_calls: [{ id: 'tc1', type: 'function', function: { name: 'do_stuff', arguments: '{"param":"value"}' } }]
      }];
      const expected = [{
        role: 'model',
        parts: [{ functionCall: { name: 'do_stuff', args: { param: 'value' } } }]
      }];
      expect(mapMessagesToGeminiContentsForTesting(messages)).toEqual(expected);
    });

    it('should map tool responses to functionResponse parts', () => {
      const messages = [{ role: 'tool', tool_call_id: 'do_stuff_123', name: 'do_stuff', content: 'Tool output here' }];
      const expected = [{
        role: 'function',
        parts: [{
          functionResponse: {
            name: 'do_stuff_123',
            response: { name: 'do_stuff_123', content: 'Tool output here' }
          }
        }]
      }];
      expect(mapMessagesToGeminiContentsForTesting(messages)).toEqual(expected);
    });
  });

  describe('mapToolsToGeminiDeclarations (Simulated with prepareSchemaForGemini)', () => {
    it('should map basic python tool correctly, processing its schema', () => {
      const result = mapToolsToGeminiDeclarationsForTesting([mockModelToolsForGeminiTest[0]]); // Test with the python tool
      const expectedPythonTool = {
        name: "python",
        description: "Executes Python code...",
        parameters: {
          type: "OBJECT",
          properties: { code: { type: "STRING", description: "python code" } },
          required: ["code"]
          // additionalProperties: false is removed
        }
      };
      expect(result[0]).toEqual(expectedPythonTool);
    });

    it('should map a complex tool with nested objects and arrays, processing its schema', () => {
      const result = mapToolsToGeminiDeclarationsForTesting([mockModelToolsForGeminiTest[1]]); // Test with the complex tool
      const expectedComplexTool = {
        name: "test_tool_with_schema_props",
        description: "A test tool with various schema properties.",
        parameters: {
          type: "OBJECT",
          properties: {
            propA: { type: "STRING", description: "Property A" },
            nestedObj: {
              type: "OBJECT",
              properties: {
                propB: { type: "INTEGER" },
                propC: { type: "BOOLEAN", description: "Property C" }
              },
              required: ["propB"]
              // additionalProperties: false is removed
            },
            simpleArray: {
              type: "ARRAY",
              items: { type: "STRING" }
              // additionalProperties from items (if object) or from array itself (if any) removed.
              // if items is an object, additionalProperties inside items is removed.
              // additionalProperties on the array itself (simpleArray object) is also removed if present.
            }
          },
          required: ["propA", "nestedObj"]
          // additionalProperties: true is removed
        }
      };
      expect(result[0]).toEqual(expectedComplexTool);
    });

    it('should handle tools with no parameters correctly', () => {
       const result = mapToolsToGeminiDeclarationsForTesting([mockModelToolsForGeminiTest[2]]); // Test with tool_without_params
       const expectedNoParamTool = {
        name: "tool_without_params",
        description: "A tool that takes no parameters.",
        parameters: undefined
       };
       expect(result[0]).toEqual(expectedNoParamTool);
    });
  });
});
