import type { ReactNode } from 'react';

export type TicketTone = 'live' | 'pending' | 'void';

const BAR: Record<TicketTone, string> = {
  live: 'bg-brand',
  pending: 'bg-gold',
  void: 'bg-ink-soft',
};

export default function Ticket({
  main,
  stub,
  tone = 'live',
  layout = 'responsive',
  className = '',
}: {
  main: ReactNode;
  stub: ReactNode;
  tone?: TicketTone;
  layout?: 'responsive' | 'stacked';
  className?: string;
}) {
  const stacked = layout === 'stacked';

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-line bg-card shadow-sm ${
        tone === 'void' ? 'opacity-80' : ''
      } ${className}`}
    >
      <div aria-hidden="true" className={`absolute inset-x-0 top-0 z-10 h-1 ${BAR[tone]}`} />
      <div className={`flex flex-col ${stacked ? '' : 'sm:flex-row'}`}>
        <div className={`min-w-0 flex-1 p-6 pt-7 ${stacked ? '' : 'sm:p-8 sm:pt-9'}`}>{main}</div>
        <div
          className={`relative border-t-2 border-dashed border-line p-6 ${
            stacked ? '' : 'sm:w-56 sm:shrink-0 sm:border-l-2 sm:border-t-0 sm:p-8 sm:pt-9'
          }`}
        >
          <span
            aria-hidden="true"
            className="absolute -left-3 -top-3 z-10 h-6 w-6 rounded-full border border-line bg-cream"
          />
          <span
            aria-hidden="true"
            className={`absolute -right-3 -top-3 z-10 h-6 w-6 rounded-full border border-line bg-cream ${
              stacked ? '' : 'sm:-bottom-3 sm:-left-3 sm:right-auto sm:top-auto'
            }`}
          />
          {stub}
        </div>
      </div>
    </div>
  );
}