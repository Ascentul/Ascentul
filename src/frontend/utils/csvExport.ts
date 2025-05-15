/**
 * Utility functions for exporting data to CSV format
 */

/**
 * Escapes special characters in CSV string
 * @param value The string value to escape
 * @returns Escaped string
 */
const escapeCSV = (value: any): string => {
  if (value === null || value === undefined) {
    return '';
  }
  
  const stringValue = String(value);
  
  // If value contains commas, newlines, or quotes, wrap in quotes and escape any quotes
  if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  
  return stringValue;
};

/**
 * Converts an array of objects to CSV string
 * @param data Array of objects to convert
 * @param headers Object mapping CSV column names to object properties
 * @returns CSV string with headers
 */
export const convertToCSV = <T extends Record<string, any>>(
  data: T[],
  headers: Record<string, keyof T | ((item: T) => any)>
): string => {
  if (!data.length) {
    return Object.keys(headers).join(',');
  }

  // Create CSV header row
  const headerRow = Object.keys(headers).join(',');
  
  // Create CSV data rows
  const rows = data.map(item => {
    return Object.entries(headers)
      .map(([_, key]) => {
        // Handle function-based property accessor
        const value = typeof key === 'function' 
          ? key(item) 
          : item[key as keyof T];
        return escapeCSV(value);
      })
      .join(',');
  });
  
  // Combine header and data rows
  return [headerRow, ...rows].join('\n');
};

/**
 * Generates a file name with timestamp for exports
 * @param prefix File name prefix
 * @param extension File extension (without dot)
 * @returns Formatted file name
 */
export const generateExportFileName = (prefix: string, extension: string = 'csv'): string => {
  const date = new Date();
  const timestamp = date.toISOString().replace(/[:.]/g, '-').split('T')[0];
  return `${prefix}_${timestamp}.${extension}`;
};

/**
 * Triggers a file download with the provided content
 * @param content File content
 * @param fileName File name
 * @param contentType MIME type
 */
export const downloadFile = (content: string, fileName: string, contentType: string = 'text/csv;charset=utf-8;'): void => {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  
  // Create temporary link element and trigger download
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  
  // Clean up
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};