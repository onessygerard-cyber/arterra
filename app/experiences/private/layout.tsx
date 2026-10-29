import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Private events',
  description: 'Plan a private art workshop for your team, group or celebration.',
};

export default function PrivateEventsLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}