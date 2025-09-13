declare module 'pdf-parse-fork' {
  interface PDFResult {
    text: string;
    numpages: number;
    version: string;
    info?: any;
    metadata?: any;
  }

  function pdfParse(buffer: Buffer): Promise<PDFResult>;
  export = pdfParse;
}
