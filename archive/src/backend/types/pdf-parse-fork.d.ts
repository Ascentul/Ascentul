declare module 'pdf-parse-fork' {
  interface PdfParseOptions {
    max?: number;
    version?: string;
    pagerender?: (data: any) => Promise<string>;
  }

  interface PdfParseResult {
    numpages: number;
    numrender: number;
    info: any;
    metadata: any;
    text: string;
    version: string;
  }

  function pdfParse(dataBuffer: Buffer, options?: PdfParseOptions): Promise<PdfParseResult>;
  export default pdfParse;
}

declare module 'pdf-parse' {
  interface PdfParseOptions {
    max?: number;
    version?: string;
    pagerender?: (data: any) => Promise<string>;
  }

  interface PdfParseResult {
    numpages: number;
    numrender: number;
    info: any;
    metadata: any;
    text: string;
    version: string;
  }

  function pdfParse(dataBuffer: Buffer, options?: PdfParseOptions): Promise<PdfParseResult>;
  export default pdfParse;
}