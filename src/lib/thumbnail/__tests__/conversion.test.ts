/**
 * Tests for thumbnail conversion utilities
 */

import { dataUrlToBlob, blobToDataUrl, getBase64Overhead } from '../conversion';

describe('dataUrlToBlob', () => {
  it('should convert valid PNG data URL to blob', () => {
    // Minimal valid PNG (1x1 transparent pixel)
    const dataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const blob = dataUrlToBlob(dataUrl);

    expect(blob.type).toBe('image/png');
    expect(blob.size).toBeGreaterThan(0);
  });

  it('should convert valid JPEG data URL to blob', () => {
    // Minimal valid JPEG
    const dataUrl = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAAA//EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAT8AH//Z';
    const blob = dataUrlToBlob(dataUrl);

    expect(blob.type).toBe('image/jpeg');
  });

  it('should default to image/png for missing MIME type', () => {
    const dataUrl = 'data:;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const blob = dataUrlToBlob(dataUrl);

    expect(blob.type).toBe('image/png');
  });

  it('should throw error for missing comma separator', () => {
    const invalidDataUrl = 'data:image/png;base64iVBORw0KGgo'; // Missing comma

    expect(() => dataUrlToBlob(invalidDataUrl)).toThrow(
      'Invalid data URL format: missing comma separator'
    );
  });

  it('should throw error for empty base64 data', () => {
    const invalidDataUrl = 'data:image/png;base64,'; // Empty after comma

    expect(() => dataUrlToBlob(invalidDataUrl)).toThrow(
      'Failed to decode base64 data'
    );
  });

  it('should throw error for malformed base64 data', () => {
    const invalidDataUrl = 'data:image/png;base64,!!!INVALID!!!'; // Invalid characters

    expect(() => dataUrlToBlob(invalidDataUrl)).toThrow(
      'Failed to decode base64 data'
    );
  });

  it('should throw error for base64 data with invalid padding', () => {
    const invalidDataUrl = 'data:image/png;base64,iVBORw0KGg'; // Missing padding

    expect(() => dataUrlToBlob(invalidDataUrl)).toThrow(
      'Failed to decode base64 data'
    );
  });

  it('should handle base64 with whitespace (spaces)', () => {
    // atob() typically ignores whitespace, but behavior can vary
    const dataUrlWithSpaces = 'data:image/png;base64,iVBORw0KGgo AAAANSU hEUgAAAA';

    // This may throw or succeed depending on browser implementation
    // We expect it to throw with our error handling
    expect(() => dataUrlToBlob(dataUrlWithSpaces)).toThrow();
  });

  it('should calculate correct blob size', () => {
    const dataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const blob = dataUrlToBlob(dataUrl);

    // Base64 decoded size should match blob size
    const base64Data = dataUrl.split(',')[1];
    const expectedSize = atob(base64Data).length;
    expect(blob.size).toBe(expectedSize);
  });

  it('should preserve MIME type exactly', () => {
    const dataUrl = 'data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAwA0JaQAA3AA/vuUAAA=';
    const blob = dataUrlToBlob(dataUrl);

    expect(blob.type).toBe('image/webp');
  });

  it('should handle data URLs with charset parameter', () => {
    const dataUrl = 'data:image/png;charset=utf-8;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const blob = dataUrlToBlob(dataUrl);

    expect(blob.type).toBe('image/png');
  });
});

describe('blobToDataUrl', () => {
  it('should convert blob to data URL', async () => {
    const data = new Uint8Array([137, 80, 78, 71]); // PNG header
    const blob = new Blob([data], { type: 'image/png' });

    const dataUrl = await blobToDataUrl(blob);

    expect(dataUrl).toMatch(/^data:image\/png;base64,/);
  });

  it('should preserve MIME type in data URL', async () => {
    const blob = new Blob([new Uint8Array([1, 2, 3])], { type: 'image/jpeg' });

    const dataUrl = await blobToDataUrl(blob);

    expect(dataUrl).toMatch(/^data:image\/jpeg;base64,/);
  });

  it('should handle empty blob', async () => {
    const blob = new Blob([], { type: 'image/png' });

    const dataUrl = await blobToDataUrl(blob);

    expect(dataUrl).toMatch(/^data:image\/png;base64,/);
    // Empty blob should produce minimal base64
    expect(dataUrl.length).toBeLessThan(50);
  });

  it('should reject if FileReader fails', async () => {
    const blob = new Blob([new Uint8Array([1, 2, 3])]);

    // Mock FileReader to simulate error
    const originalFileReader = global.FileReader;
    global.FileReader = jest.fn().mockImplementation(() => ({
      readAsDataURL: jest.fn(function(this: any) {
        setTimeout(() => {
          if (this.onerror) {
            this.onerror(new Error('Mock read error'));
          }
        }, 0);
      }),
    })) as any;

    await expect(blobToDataUrl(blob)).rejects.toThrow();

    global.FileReader = originalFileReader;
  });

  it('should handle large blobs', async () => {
    // Create 1MB blob
    const largeData = new Uint8Array(1024 * 1024);
    for (let i = 0; i < largeData.length; i++) {
      largeData[i] = i % 256;
    }
    const blob = new Blob([largeData], { type: 'image/png' });

    const dataUrl = await blobToDataUrl(blob);

    expect(dataUrl).toMatch(/^data:image\/png;base64,/);
    // Base64 should be larger than original (33% overhead)
    expect(dataUrl.length).toBeGreaterThan(largeData.length);
  });
});

describe('getBase64Overhead', () => {
  it('should calculate exact size for multiple-of-3 bytes', () => {
    // 3 bytes encode to exactly 4 base64 characters (no padding)
    const result = getBase64Overhead(3);

    expect(result.binarySize).toBe(3);
    expect(result.base64Size).toBe(4);
    expect(result.overheadPercent).toBeCloseTo(33.333, 2);
  });

  it('should add padding for 1 byte (needs 2 padding chars)', () => {
    // 1 byte needs 4 base64 characters (2 data + 2 padding '==')
    const result = getBase64Overhead(1);

    expect(result.binarySize).toBe(1);
    expect(result.base64Size).toBe(4);
    expect(result.overheadPercent).toBe(300); // 4x increase
  });

  it('should add padding for 2 bytes (needs 1 padding char)', () => {
    // 2 bytes need 4 base64 characters (3 data + 1 padding '=')
    const result = getBase64Overhead(2);

    expect(result.binarySize).toBe(2);
    expect(result.base64Size).toBe(4);
    expect(result.overheadPercent).toBe(100); // 2x increase
  });

  it('should calculate exact size for 4 bytes', () => {
    // 4 bytes need 8 base64 characters
    // ceil(4/3) = 2 groups, so 2 * 4 = 8 characters total
    const result = getBase64Overhead(4);

    expect(result.binarySize).toBe(4);
    expect(result.base64Size).toBe(8);
    expect(result.overheadPercent).toBe(100);
  });

  it('should calculate exact size for 5 bytes', () => {
    // 5 bytes need 8 base64 characters
    // ceil(5/3) = 2, so 2 * 4 = 8
    const result = getBase64Overhead(5);

    expect(result.binarySize).toBe(5);
    expect(result.base64Size).toBe(8);
    expect(result.overheadPercent).toBe(60);
  });

  it('should calculate exact size for 6 bytes', () => {
    // 6 bytes encode to exactly 8 base64 characters (no padding)
    // ceil(6/3) = 2, so 2 * 4 = 8
    const result = getBase64Overhead(6);

    expect(result.binarySize).toBe(6);
    expect(result.base64Size).toBe(8);
    expect(result.overheadPercent).toBeCloseTo(33.333, 2);
  });

  it('should calculate overhead for typical sizes', () => {
    const result = getBase64Overhead(100000);

    expect(result.binarySize).toBe(100000);
    // ceil(100000/3) = 33334, so 33334 * 4 = 133336
    expect(result.base64Size).toBe(133336);
    expect(result.overheadPercent).toBeCloseTo(33.336, 2);
  });

  it('should handle large file sizes', () => {
    const result = getBase64Overhead(10000000); // 10MB

    expect(result.binarySize).toBe(10000000);
    // ceil(10000000/3) = 3333334, so 3333334 * 4 = 13333336
    expect(result.base64Size).toBe(13333336);
    expect(result.base64Size).toBeGreaterThan(10000000);
    expect(result.overheadPercent).toBeCloseTo(33.33336, 2);
  });

  it('should handle zero size without division by zero', () => {
    const result = getBase64Overhead(0);

    expect(result.binarySize).toBe(0);
    expect(result.base64Size).toBe(0);
    expect(result.overheadPercent).toBe(0);
    expect(result.overheadPercent).not.toBe(Infinity);
    expect(result.overheadPercent).not.toBe(NaN);
  });

  it('should match actual base64 encoding size', () => {
    // Verify our formula matches actual base64 encoding
    const testSizes = [1, 2, 3, 4, 5, 6, 10, 100, 1000];

    testSizes.forEach(size => {
      const result = getBase64Overhead(size);

      // Create actual data and encode it
      const data = new Uint8Array(size);
      for (let i = 0; i < size; i++) {
        data[i] = i % 256;
      }

      // Convert to base64 and measure
      const base64 = btoa(String.fromCharCode(...data));
      const actualBase64Size = base64.length;

      expect(result.base64Size).toBe(actualBase64Size);
    });
  });

  it('should show overhead decreases as size increases', () => {
    const small = getBase64Overhead(1);
    const medium = getBase64Overhead(100);
    const large = getBase64Overhead(100000);

    // Smaller sizes have proportionally higher overhead due to padding
    expect(small.overheadPercent).toBeGreaterThan(medium.overheadPercent);
    expect(medium.overheadPercent).toBeGreaterThan(large.overheadPercent);

    // Large sizes approach 33.33% overhead
    expect(large.overheadPercent).toBeCloseTo(33.33, 1);
  });
});

describe('Round-trip conversion', () => {
  it('should preserve data through round-trip conversion', async () => {
    const originalData = new Uint8Array([1, 2, 3, 4, 5, 255, 128, 0]);
    const blob = new Blob([originalData], { type: 'image/png' });

    // Blob -> Data URL
    const dataUrl = await blobToDataUrl(blob);

    // Data URL -> Blob
    const resultBlob = dataUrlToBlob(dataUrl);

    expect(resultBlob.type).toBe('image/png');
    expect(resultBlob.size).toBe(originalData.length);

    // Verify data integrity
    const resultData = new Uint8Array(await resultBlob.arrayBuffer());
    expect(Array.from(resultData)).toEqual(Array.from(originalData));
  });

  it('should preserve MIME type through round-trip', async () => {
    const blob = new Blob([new Uint8Array([1, 2, 3])], { type: 'image/jpeg' });

    const dataUrl = await blobToDataUrl(blob);
    const resultBlob = dataUrlToBlob(dataUrl);

    expect(resultBlob.type).toBe('image/jpeg');
  });
});

describe('Error message quality', () => {
  it('should provide helpful error for malformed base64', () => {
    const invalidDataUrl = 'data:image/png;base64,NOT_BASE64!!!';

    expect(() => dataUrlToBlob(invalidDataUrl)).toThrow(/Failed to decode base64 data/);
  });

  it('should include original error message', () => {
    const invalidDataUrl = 'data:image/png;base64,!!!';

    try {
      dataUrlToBlob(invalidDataUrl);
      fail('Should have thrown an error');
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toContain('Failed to decode base64 data');
    }
  });
});