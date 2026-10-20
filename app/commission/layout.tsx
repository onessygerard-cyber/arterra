import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Request a Commission',
  description: 'Describe the piece you have in mind and Arterra will match you with a verified artist.',
};

export default function CommissionLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}