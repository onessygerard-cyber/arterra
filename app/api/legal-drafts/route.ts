import { requireAdmin } from '@/lib/require-admin';
import { countPlaceholders, legalPublished, privacyDoc, termsDoc } from '@/lib/legal';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
  }

  return NextResponse.json({
    published: legalPublished(),
    switchOn: process.env.NEXT_PUBLIC_LEGAL_PUBLISHED === 'true',
    docs: [
      { key: 'terms', doc: termsDoc, open: countPlaceholders(termsDoc) },
      { key: 'privacy', doc: privacyDoc, open: countPlaceholders(privacyDoc) },
    ],
  });
}