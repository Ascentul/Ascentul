import { NextResponse } from 'next/server';
import { getEditorHealthSnapshot } from '@/features/resume/editor/state/editorHealth';
import { getAppVersion } from '@/lib/version';

export async function GET() {
  const snapshot = getEditorHealthSnapshot();
  const storeActive = process.env.NEXT_PUBLIC_RESUME_V2_STORE === 'true';

  return NextResponse.json({
    version: getAppVersion(),
    storeActive,
    selectionCount: snapshot.selectionCount,
    isDirty: snapshot.isDirty,
  });
}
