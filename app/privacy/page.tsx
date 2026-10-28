import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import LegalPage from '@/components/LegalPage';
import { legalPublished, privacyDoc } from '@/lib/legal';

export const metadata: Metadata = { title: 'Privacy Policy' };

export default function PrivacyPage() {
  if (!legalPublished()) notFound();
  return <LegalPage doc={privacyDoc} />;
}