import { requireAdmin } from '@/lib/require-admin';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const admin = await requireAdmin(request);
  return NextResponse.json({ admin: !!admin });
}