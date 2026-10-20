import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Become an Artist',
  description: 'Apply to show your work on Arterra. Every application is reviewed by hand.',
};

export default function JoinLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}