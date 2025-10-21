import { NextResponse } from 'next/server';
import { getEditorHealthSnapshot } from '@/features/resume/editor/state/editorHealth';
import { getAppVersion } from '@/lib/version';

export function GET() {
  try {
    const snapshot = getEditorHealthSnapshot();
    const storeActive = process.env.NEXT_PUBLIC_RESUME_V2_STORE === 'true';

    return NextResponse.json({
      version: getAppVersion(),
      storeActive,
      selectionCount: snapshot.selectionCount,
      isDirty: snapshot.isDirty,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Health check failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
