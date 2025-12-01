import { NextRequest, NextResponse } from 'next/server';

import { createRequestLogger, getCorrelationIdFromRequest, toErrorCode } from '@/lib/logger';

export async function POST(request: NextRequest) {
  const correlationId = getCorrelationIdFromRequest(request);
  const log = createRequestLogger(correlationId, {
    feature: 'resume',
    httpMethod: 'POST',
    httpPath: '/api/resumes/extract',
  });

  const startTime = Date.now();
  log.info('Resume extraction request started', { event: 'request.start' });

  try {
    const form = await request.formData();
    const file = form.get('file') as File | null;

    if (!file) {
      log.warn('Missing file in request', { event: 'validation.failed', errorCode: 'BAD_REQUEST' });
      return NextResponse.json(
        { error: 'Missing file' },
        {
          status: 400,
          headers: { 'x-correlation-id': correlationId },
        },
      );
    }

    const name = (file.name || '').toLowerCase();
    const mime = (file.type || '').toLowerCase();
    const ab = await file.arrayBuffer();
    const buffer = Buffer.from(ab);

    const isPdf = mime === 'application/pdf' || name.endsWith('.pdf');
    const isDocx =
      mime.includes('officedocument.wordprocessingml.document') || name.endsWith('.docx');

    log.debug('Processing file', {
      event: 'file.process',
      extra: { fileType: isPdf ? 'pdf' : isDocx ? 'docx' : 'unknown', fileSize: buffer.length },
    });

    if (isPdf) {
      try {
        // Use pdf-parse-fork which is more reliable
        const pdfParse = (await import('pdf-parse-fork')).default;
        const result = await pdfParse(buffer);
        const text = (result.text || '').trim();

        const durationMs = Date.now() - startTime;
        log.info('PDF extraction successful', {
          event: 'request.success',
          httpStatus: 200,
          durationMs,
          extra: { pages: result.numpages, textLength: text.length },
        });

        return NextResponse.json(
          {
            text,
            info: { pages: result.numpages, version: result.version, type: 'pdf' },
          },
          {
            headers: { 'x-correlation-id': correlationId },
          },
        );
      } catch (pdfError: any) {
        log.warn('PDF parse error', {
          event: 'file.parse.error',
          errorCode: toErrorCode(pdfError),
          extra: { fileType: 'pdf' },
        });
        // Fallback: return basic info about the file
        return NextResponse.json(
          {
            text: '',
            info: {
              type: 'pdf',
              error: 'Could not extract text from this PDF. It may be image-based or corrupted.',
            },
            warning: 'Text extraction failed - PDF may be image-based',
          },
          {
            headers: { 'x-correlation-id': correlationId },
          },
        );
      }
    }

    if (isDocx) {
      try {
        const mammoth = await import('mammoth');
        const { value } = await mammoth.extractRawText({ buffer });
        const text = String(value || '').trim();

        const durationMs = Date.now() - startTime;
        log.info('DOCX extraction successful', {
          event: 'request.success',
          httpStatus: 200,
          durationMs,
          extra: { textLength: text.length },
        });

        return NextResponse.json(
          { text, info: { type: 'docx' } },
          {
            headers: { 'x-correlation-id': correlationId },
          },
        );
      } catch (e) {
        log.warn('DOCX parsing failed - mammoth not installed', {
          event: 'dependency.missing',
          errorCode: 'MISSING_DEPENDENCY',
        });
        return NextResponse.json(
          {
            error:
              'DOCX support requires the "mammoth" package. Please install it: npm install mammoth',
            missingDependency: 'mammoth',
          },
          {
            status: 501,
            headers: { 'x-correlation-id': correlationId },
          },
        );
      }
    }

    log.warn('Unsupported file type', {
      event: 'validation.failed',
      errorCode: 'UNSUPPORTED_TYPE',
      extra: { mime, fileName: name },
    });
    return NextResponse.json(
      { error: 'Unsupported file type. Please upload a PDF or DOCX file.' },
      {
        status: 415,
        headers: { 'x-correlation-id': correlationId },
      },
    );
  } catch (err: any) {
    const durationMs = Date.now() - startTime;
    log.error('Resume extraction request failed', toErrorCode(err), {
      event: 'request.error',
      httpStatus: 500,
      durationMs,
    });
    return NextResponse.json(
      { error: 'Failed to extract text' },
      {
        status: 500,
        headers: { 'x-correlation-id': correlationId },
      },
    );
  }
}

export async function GET(request: NextRequest) {
  const correlationId = getCorrelationIdFromRequest(request);
  return NextResponse.json(
    { error: 'Method not allowed' },
    {
      status: 405,
      headers: { 'x-correlation-id': correlationId },
    },
  );
}
