/**
 * Thumbnail conversion utilities
 *
 * Provides helpers for converting between thumbnail formats (data URLs, Blobs, ArrayBuffers).
 * Used by both the thumbnail generator hook and migration scripts.
 */

/**
 * Convert a data URL to a Blob
 *
 * Handles the data URL format: data:image/png;base64,<base64-string>
 * Supports any image MIME type (defaults to image/png if not specified)
 *
 * @param dataUrl - Data URL string (e.g., "data:image/png;base64,iVBORw0KG...")
 * @returns Blob with the decoded binary data and correct MIME type
 * @throws Error if data URL format is invalid or base64 data is malformed
 *
 * @example
 * const dataUrl = canvas.toDataURL('image/png');
 * const blob = dataUrlToBlob(dataUrl);
 * console.log(blob.type); // "image/png"
 * console.log(blob.size); // bytes
 *
 * @example
 * // Error handling
 * try {
 *   const blob = dataUrlToBlob(malformedDataUrl);
 * } catch (error) {
 *   console.error('Failed to decode:', error.message);
 * }
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  // Split on first comma to separate header from base64 data
  // Use indexOf instead of split to truly only split on the FIRST comma
  const commaIndex = dataUrl.indexOf(',');
  if (commaIndex === -1) {
    throw new Error('Invalid data URL format: missing comma separator');
  }

  const header = dataUrl.slice(0, commaIndex);
  const base64Data = dataUrl.slice(commaIndex + 1);

  // Extract MIME type from header (e.g., "data:image/png;base64" -> "image/png")
  const mimeMatch = header.match(/data:([^;]+)/);
  const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';

  try {
    // Decode base64 to binary
    // atob() can throw DOMException if base64 string is malformed
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    return new Blob([bytes], { type: mimeType });
  } catch (error) {
    // Provide clear error message for debugging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to decode base64 data: ${errorMessage}`);
  }
}

/**
 * Convert a Blob to a data URL
 *
 * Reads the blob as a data URL string for inline embedding or storage.
 * Useful for converting Blobs from canvas.toBlob() to data URLs.
 *
 * @param blob - Blob to convert (typically from canvas.toBlob)
 * @returns Promise resolving to data URL string
 *
 * @example
 * canvas.toBlob(async (blob) => {
 *   if (blob) {
 *     const dataUrl = await blobToDataUrl(blob);
 *     console.log(dataUrl); // "data:image/png;base64,..."
 *   }
 * }, 'image/png');
 */
export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('FileReader result is not a string'));
      }
    };
    reader.onerror = () => reject(reader.error || new Error('Failed to read blob'));
    reader.readAsDataURL(blob);
  });
}

/**
 * Get the size overhead when encoding as base64
 *
 * Base64 encoding increases size by ~33% due to representing binary data
 * as ASCII text. This helper calculates the overhead.
 *
 * Base64 encoding works by:
 * 1. Converting 3 bytes (24 bits) into 4 base64 characters
 * 2. Padding output to a multiple of 4 characters with '=' if needed
 *
 * @param binarySize - Original binary size in bytes
 * @returns Object with binary size, base64 size, and overhead percentage
 *
 * @example
 * const blob = new Blob([data]);
 * const overhead = getBase64Overhead(blob.size);
 * console.log(overhead);
 * // { binarySize: 100000, base64Size: 133336, overheadPercent: 33.336 }
 *
 * @example
 * // Edge case: empty data
 * getBase64Overhead(0);
 * // { binarySize: 0, base64Size: 0, overheadPercent: 0 }
 */
export function getBase64Overhead(binarySize: number): {
  binarySize: number;
  base64Size: number;
  overheadPercent: number;
} {
  // Handle edge case: zero size to avoid division by zero
  if (binarySize === 0) {
    return { binarySize: 0, base64Size: 0, overheadPercent: 0 };
  }

  // Base64 encodes 3 bytes as 4 characters, with padding to multiple of 4
  // Correct formula: 4 * ceil(binarySize / 3)
  // This accounts for padding characters ('=') added to reach multiple of 4
  const base64Size = 4 * Math.ceil(binarySize / 3);
  const overheadPercent = ((base64Size / binarySize - 1) * 100);

  return {
    binarySize,
    base64Size,
    overheadPercent,
  };
}
