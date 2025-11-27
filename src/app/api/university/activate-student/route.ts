import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    {
      error: 'Deprecated endpoint. Use the student invite flow with tokenized links.',
    },
    { status: 410 },
  );
}
