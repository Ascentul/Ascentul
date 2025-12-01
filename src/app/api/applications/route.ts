import { NextResponse } from 'next/server';
const gone = () =>
  NextResponse.json(
    {
      error:
        'This endpoint has been deprecated. Applications are now stored exclusively in Convex.',
      action: 'Use Convex client (convex/react) and api.applications.* functions instead.',
    },
    { status: 410 },
  );

export async function GET() {
  return gone();
}

export async function POST() {
  return gone();
}
