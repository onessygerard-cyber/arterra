import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    { error: 'This lookup has been retired. Use your private tracking link instead.' },
    { status: 410 }
  );
}