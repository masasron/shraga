import { convertSchemaTypesToUpper } from './common';

describe('utils/common', () => {
  describe('convertSchemaTypesToUpper', () => {
    it('should return schema as is if not an object or null', () => {
      expect(convertSchemaTypesToUpper(null)).toBeNull();
      expect(convertSchemaTypesToUpper(undefined)).toBeUndefined();
      expect(convertSchemaTypesToUpper("string")).toBe("string");
      expect(convertSchemaTypesToUpper(123)).toBe(123);
    });

    it('should convert top-level "type" string to uppercase', () => {
      const schema = { type: 'string', format: 'email' };
      const expected = { type: 'STRING', format: 'email' };
      expect(convertSchemaTypesToUpper(schema)).toEqual(expected);
    });

    it('should convert nested "type" strings to uppercase', () => {
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'integer' },
          address: {
            type: 'object',
            properties: {
              street: { type: 'string' },
              city: { type: 'string' },
            },
          },
        },
      };
      const expected = {
        type: 'OBJECT',
        properties: {
          name: { type: 'STRING' },
          age: { type: 'INTEGER' },
          address: {
            type: 'OBJECT',
            properties: {
              street: { type: 'STRING' },
              city: { type: 'STRING' },
            },
          },
        },
      };
      expect(convertSchemaTypesToUpper(schema)).toEqual(expected);
    });

    it('should handle arrays of schemas, converting types within objects in array', () => {
      const schema = {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            value: { type: 'string' },
          },
        },
      };
      const expected = {
        type: 'ARRAY',
        items: {
          type: 'OBJECT',
          properties: {
            id: { type: 'INTEGER' },
            value: { type: 'STRING' },
          },
        },
      };
      expect(convertSchemaTypesToUpper(schema)).toEqual(expected);
    });

    it('should handle schemas with no "type" property at certain levels', () => {
      const schema = {
        properties: {
          name: { type: 'string' },
          details: { description: 'Some details' }
        }
      };
      const expected = {
        properties: {
          name: { type: 'STRING' },
          details: { description: 'Some details' }
        }
      };
      expect(convertSchemaTypesToUpper(schema)).toEqual(expected);
    });

    it('should not modify other properties', () => {
      const schema = {
        type: 'object',
        description: 'A simple object',
        required: ['name'],
        properties: {
          name: { type: 'string', description: 'Name of the item' },
        },
      };
      const expected = {
        type: 'OBJECT',
        description: 'A simple object',
        required: ['name'],
        properties: {
          name: { type: 'STRING', description: 'Name of the item' },
        },
      };
      expect(convertSchemaTypesToUpper(schema)).toEqual(expected);
    });

    it('should handle empty objects and arrays', () => {
      expect(convertSchemaTypesToUpper({})).toEqual({});
      expect(convertSchemaTypesToUpper([])).toEqual([]);
      const schemaWithEmpty = { type: 'object', properties: {}, items: [] };
      const expectedWithEmpty = { type: 'OBJECT', properties: {}, items: [] };
      expect(convertSchemaTypesToUpper(schemaWithEmpty)).toEqual(expectedWithEmpty);
    });
  });
});
