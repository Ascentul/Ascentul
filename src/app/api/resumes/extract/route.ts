import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();
    const file = form.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Missing file' }, { status: 400 });
    }

    const name = (file.name || '').toLowerCase();
    const mime = (file.type || '').toLowerCase();
    const ab = await file.arrayBuffer();
    const buffer = Buffer.from(ab);

    const isPdf = mime === 'application/pdf' || name.endsWith('.pdf');
    const isDocx =
      mime.includes('officedocument.wordprocessingml.document') || name.endsWith('.docx');

    if (isPdf) {
      try {
        // Use pdf-parse-fork which is more reliable
        const pdfParse = (await import('pdf-parse-fork')).default;
        const result = await pdfParse(buffer);
        const text = (result.text || '').trim();
        return NextResponse.json({
          text,
          info: { pages: result.numpages, version: result.version, type: 'pdf' },
        });
      } catch (pdfError: any) {
        console.error('PDF parse error:', pdfError);
        // Fallback: return basic info about the file
        return NextResponse.json({
          text: '',
          info: {
            type: 'pdf',
            error: 'Could not extract text from this PDF. It may be image-based or corrupted.',
          },
          warning: 'Text extraction failed - PDF may be image-based',
        });
      }
    }

    if (isDocx) {
      try {
        const mammoth = await import('mammoth');
        const { value } = await mammoth.extractRawText({ buffer });
        const text = String(value || '').trim();
        return NextResponse.json({ text, info: { type: 'docx' } });
      } catch (e) {
        return NextResponse.json(
          {
            error:
              'DOCX support requires the "mammoth" package. Please install it: npm install mammoth',
            missingDependency: 'mammoth',
          },
          { status: 501 },
        );
      }
    }

    return NextResponse.json(
      { error: 'Unsupported file type. Please upload a PDF or DOCX file.' },
      { status: 415 },
    );
  } catch (err: any) {
    console.error('extract error', err);
    return NextResponse.json({ error: 'Failed to extract text' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
