/**
 * Tests for validate-preview-images.js regex patterns
 *
 * Ensures that field extraction patterns correctly handle:
 * - Apostrophes in strings
 * - Escaped quotes
 * - Other escape sequences
 */

describe('Field extraction regex patterns', () => {
  // Extract regex patterns from the script
  // These patterns match the ones in validate-preview-images.js
  // Note: Group 1 is the quote character, group 2 is the actual value
  const idPattern = /id:\s*(["'])((?:(?!\1)[^\\]|\\.)*)\1/;
  const slugPattern = /slug:\s*(["'])((?:(?!\1)[^\\]|\\.)*)\1/;
  const namePattern = /name:\s*(["'])((?:(?!\1)[^\\]|\\.)*)\1/;
  const previewPattern = /preview:\s*(["'])((?:(?!\1)[^\\]|\\.)*)\1/;

  describe('namePattern - apostrophes', () => {
    it('should extract name with apostrophe in double quotes', () => {
      const input = `{ name: "Bob's Template" }`;
      const match = namePattern.exec(input);

      expect(match).not.toBeNull();
      expect(match[2]).toBe("Bob's Template"); // Group 2 contains the value
    });

    it('should extract name with apostrophe in single quotes with escape', () => {
      const input = `{ name: 'Bob\\'s Template' }`;
      const match = namePattern.exec(input);

      expect(match).not.toBeNull();
      expect(match[2]).toBe("Bob\\'s Template");
    });

    it('should extract name with multiple apostrophes', () => {
      const input = `{ name: "Artist's Bob's Template" }`;
      const match = namePattern.exec(input);

      expect(match).not.toBeNull();
      expect(match[2]).toBe("Artist's Bob's Template");
    });
  });

  describe('previewPattern - special characters', () => {
    it('should extract preview with apostrophe', () => {
      const input = `{ preview: "artist's-preview.png" }`;
      const match = previewPattern.exec(input);

      expect(match).not.toBeNull();
      expect(match[2]).toBe("artist's-preview.png");
    });

    it('should extract preview with hyphens and underscores', () => {
      const input = `{ preview: "bob-s_template-preview.png" }`;
      const match = previewPattern.exec(input);

      expect(match).not.toBeNull();
      expect(match[2]).toBe("bob-s_template-preview.png");
    });

    it('should extract preview with path separators', () => {
      const input = `{ preview: "templates/artist's/preview.png" }`;
      const match = previewPattern.exec(input);

      expect(match).not.toBeNull();
      expect(match[2]).toBe("templates/artist's/preview.png");
    });
  });

  describe('Escaped quotes', () => {
    it('should handle escaped double quotes', () => {
      const input = `{ name: "Template with \\"quotes\\"" }`;
      const match = namePattern.exec(input);

      expect(match).not.toBeNull();
      expect(match[2]).toBe('Template with \\"quotes\\"');
    });

    it('should handle escaped single quotes', () => {
      const input = `{ name: 'Template with \\'quotes\\'' }`;
      const match = namePattern.exec(input);

      expect(match).not.toBeNull();
      expect(match[2]).toBe("Template with \\'quotes\\'");
    });

    it('should handle mixed quotes and apostrophes', () => {
      const input = `{ name: "Bob's \\"Special\\" Template" }`;
      const match = namePattern.exec(input);

      expect(match).not.toBeNull();
      expect(match[2]).toBe('Bob\'s \\"Special\\" Template');
    });
  });

  describe('Other escape sequences', () => {
    it('should handle escaped backslash', () => {
      const input = `{ preview: "path\\\\file.png" }`;
      const match = previewPattern.exec(input);

      expect(match).not.toBeNull();
      expect(match[2]).toBe("path\\\\file.png");
    });

    it('should handle newline escape', () => {
      const input = `{ name: "Line 1\\nLine 2" }`;
      const match = namePattern.exec(input);

      expect(match).not.toBeNull();
      expect(match[2]).toBe("Line 1\\nLine 2");
    });

    it('should handle tab escape', () => {
      const input = `{ name: "Column 1\\tColumn 2" }`;
      const match = namePattern.exec(input);

      expect(match).not.toBeNull();
      expect(match[2]).toBe("Column 1\\tColumn 2");
    });
  });

  describe('Edge cases', () => {
    it('should handle empty string', () => {
      const input = `{ name: "" }`;
      const match = namePattern.exec(input);

      expect(match).not.toBeNull();
      expect(match[2]).toBe("");
    });

    it('should handle string with only spaces', () => {
      const input = `{ name: "   " }`;
      const match = namePattern.exec(input);

      expect(match).not.toBeNull();
      expect(match[2]).toBe("   ");
    });

    it('should handle consecutive escape sequences', () => {
      const input = `{ name: "Test\\n\\t\\\\End" }`;
      const match = namePattern.exec(input);

      expect(match).not.toBeNull();
      expect(match[2]).toBe("Test\\n\\t\\\\End");
    });

    it('should not match unclosed quote', () => {
      const input = `{ name: "Unclosed }`;
      const match = namePattern.exec(input);

      expect(match).toBeNull();
    });

    it('should not match mismatched quotes', () => {
      const input = `{ name: "Mixed' }`;
      const match = namePattern.exec(input);

      expect(match).toBeNull();
    });
  });

  describe('Multiple fields', () => {
    it('should extract all fields from complex object', () => {
      const input = `{
        id: "artist-template",
        slug: "artist's-special",
        name: "Artist's \\"Special\\" Template",
        preview: "artist's-preview.png",
        category: "creative"
      }`;

      const idMatch = idPattern.exec(input);
      const slugMatch = slugPattern.exec(input);
      const nameMatch = namePattern.exec(input);
      const previewMatch = previewPattern.exec(input);

      expect(idMatch[2]).toBe("artist-template");
      expect(slugMatch[2]).toBe("artist's-special");
      expect(nameMatch[2]).toBe('Artist\'s \\"Special\\" Template');
      expect(previewMatch[2]).toBe("artist's-preview.png");
    });

    it('should handle fields in any order', () => {
      const input = `{
        preview: "bob's-preview.png",
        name: "Bob's Template",
        id: "bob-template",
        slug: "bobs-template"
      }`;

      const idMatch = idPattern.exec(input);
      const slugMatch = slugPattern.exec(input);
      const nameMatch = namePattern.exec(input);
      const previewMatch = previewPattern.exec(input);

      expect(idMatch[2]).toBe("bob-template");
      expect(slugMatch[2]).toBe("bobs-template");
      expect(nameMatch[2]).toBe("Bob's Template");
      expect(previewMatch[2]).toBe("bob's-preview.png");
    });
  });

  describe('Real-world examples', () => {
    it('should handle template with possessive name', () => {
      const input = `{
        id: "designer-pro",
        slug: "designer-pro",
        name: "Designer's Professional Template",
        preview: "designer's-pro-preview.png"
      }`;

      const nameMatch = namePattern.exec(input);
      const previewMatch = previewPattern.exec(input);

      expect(nameMatch[2]).toBe("Designer's Professional Template");
      expect(previewMatch[2]).toBe("designer's-pro-preview.png");
    });

    it('should handle template with special characters', () => {
      const input = `{
        id: "special-chars",
        slug: "special-chars",
        name: "Template: \\"The Best\\" (Bob's Edition)",
        preview: "special-preview.png"
      }`;

      const nameMatch = namePattern.exec(input);

      expect(nameMatch[2]).toBe('Template: \\"The Best\\" (Bob\'s Edition)');
    });

    it('should handle template with path in preview', () => {
      const input = `{
        id: "nested-path",
        slug: "nested",
        name: "Nested Template",
        preview: "categories/artist's-work/preview.png"
      }`;

      const previewMatch = previewPattern.exec(input);

      expect(previewMatch[2]).toBe("categories/artist's-work/preview.png");
    });
  });

  describe('Regression tests', () => {
    it('should not stop at apostrophe in double-quoted string (original bug)', () => {
      // Original bug: pattern stopped at apostrophe
      const input = `{ name: "Bob's Template" }`;
      const match = namePattern.exec(input);

      expect(match).not.toBeNull();
      expect(match[2]).toBe("Bob's Template");
      expect(match[2]).not.toBe("Bob"); // Should NOT stop at apostrophe
    });

    it('should not stop at apostrophe in preview path (original bug)', () => {
      // Original bug: pattern stopped at apostrophe in filename
      const input = `{ preview: "artist's-preview.png" }`;
      const match = previewPattern.exec(input);

      expect(match).not.toBeNull();
      expect(match[2]).toBe("artist's-preview.png");
      expect(match[2]).not.toBe("artist"); // Should NOT stop at apostrophe
    });

    it('should handle escaped apostrophe in single-quoted string', () => {
      const input = `{ name: 'Bob\\'s Template' }`;
      const match = namePattern.exec(input);

      expect(match).not.toBeNull();
      expect(match[2]).toBe("Bob\\'s Template");
    });
  });
});
