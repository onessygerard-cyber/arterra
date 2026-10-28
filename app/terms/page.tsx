import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import LegalPage from '@/components/LegalPage';
import { legalPublished, termsDoc } from '@/lib/legal';

export const metadata: Metadata = { title: 'Terms & Conditions' };

export default function TermsPage() {
  if (!legalPublished()) notFound();
  return <LegalPage doc={termsDoc} />;
}