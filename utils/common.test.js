import { prepareSchemaForGemini } from './common';

describe('utils/common', () => {
  describe('prepareSchemaForGemini', () => {
    it('should return input as is for null, undefined, or non-object/array types', () => {
      expect(prepareSchemaForGemini(null)).toBeNull();
      expect(prepareSchemaForGemini(undefined)).toBeUndefined();
      expect(prepareSchemaForGemini("string")).toBe("string");
      expect(prepareSchemaForGemini(123)).toBe(123);
      expect(prepareSchemaForGemini(true)).toBe(true);
    });

    it('should handle empty objects and arrays', () => {
      expect(prepareSchemaForGemini({})).toEqual({});
      expect(prepareSchemaForGemini([])).toEqual([]);
    });

    it('should process a basic schema: uppercase type and remove additionalProperties', () => {
      const basicSchema = {
        type: "object",
        properties: { name: { type: "string" } },
        additionalProperties: false
      };
      const expectedBasic = {
        type: "OBJECT",
        properties: { name: { type: "STRING" } }
      };
      const originalSchema = JSON.parse(JSON.stringify(basicSchema)); // Deep clone
      const result = prepareSchemaForGemini(basicSchema);
      expect(result).toEqual(expectedBasic);
      expect(basicSchema).toEqual(originalSchema); // Ensure original is not mutated
    });

    it('should process a nested schema: uppercase types and remove additionalProperties at all levels', () => {
      const nestedSchema = {
        type: "object",
        properties: {
          user: {
            type: "object",
            properties: { id: { type: "integer" }, details: { type: "string" } },
            additionalProperties: true
          },
          config: {
            type: "array",
            items: {
              type: "object",
              properties: { key: { type: "string" }, value: { type: "boolean"} },
              additionalProperties: false
            }
          }
        },
        additionalProperties: false
      };
      const expectedNested = {
        type: "OBJECT",
        properties: {
          user: {
            type: "OBJECT",
            properties: { id: { type: "INTEGER" }, details: { type: "STRING" } }
          },
          config: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: { key: { type: "STRING" }, value: {type: "BOOLEAN"} }
            }
          }
        }
      };
      const originalSchema = JSON.parse(JSON.stringify(nestedSchema)); // Deep clone
      const result = prepareSchemaForGemini(nestedSchema);
      expect(result).toEqual(expectedNested);
      expect(nestedSchema).toEqual(originalSchema); // Ensure original is not mutated
    });

    it('should process schemas with allOf, anyOf, oneOf by example', () => {
      const complexSchema = {
        type: "object",
        allOf: [
          { properties: { prop1: { type: "string", additionalProperties: true } }, additionalProperties: false }
        ],
        anyOf: [
          { type: "object", properties: { opt1: { type: "number" } }, additionalProperties: true }
        ],
        oneOf: [
          { type: "boolean" }
        ],
        additionalProperties: false
      };
      const expectedComplex = {
        type: "OBJECT",
        allOf: [
          { properties: { prop1: { type: "STRING" } } }
        ],
        anyOf: [
          { type: "OBJECT", properties: { opt1: { type: "NUMBER" } } }
        ],
        oneOf: [
          { type: "BOOLEAN" }
        ]
      };
      const originalSchema = JSON.parse(JSON.stringify(complexSchema)); // Deep clone
      const result = prepareSchemaForGemini(complexSchema);
      expect(result).toEqual(expectedComplex);
      expect(complexSchema).toEqual(originalSchema); // Ensure original is not mutated
    });

    it('should process a schema that is an array of schemas', () => {
      const arraySchema = [
        { type: "string", additionalProperties: false },
        { type: "integer", description: "An integer" },
        { type: "object", properties: {arrProp: {type: "boolean"}}, additionalProperties: true}
      ];
      const expectedArraySchema = [
        { type: "STRING" },
        { type: "INTEGER", description: "An integer" },
        { type: "OBJECT", properties: {arrProp: {type: "BOOLEAN"}}}
      ];
      const originalSchema = JSON.parse(JSON.stringify(arraySchema)); // Deep clone
      const result = prepareSchemaForGemini(arraySchema);
      expect(result).toEqual(expectedArraySchema);
      expect(arraySchema).toEqual(originalSchema); // Ensure original is not mutated
    });

    it('should correctly handle patternProperties', () => {
      const schemaWithPattern = {
        type: "object",
        patternProperties: {
          "^S_": { type: "string", additionalProperties: false },
          "^N_": { type: "number" }
        },
        additionalProperties: true
      };
      const expectedSchemaWithPattern = {
        type: "OBJECT",
        patternProperties: {
          "^S_": { type: "STRING" },
          "^N_": { type: "NUMBER" }
        }
      };
      const originalSchema = JSON.parse(JSON.stringify(schemaWithPattern));
      const result = prepareSchemaForGemini(schemaWithPattern);
      expect(result).toEqual(expectedSchemaWithPattern);
      expect(schemaWithPattern).toEqual(originalSchema);
    });
  });
});
