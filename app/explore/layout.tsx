import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Explore Artists',
  description: 'Browse verified independent artists and their original work.',
};

export default function ExploreLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}