'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { notify, onToast, type ToastItem } from '@/lib/toast';

const MAX = 4;

const ACCENT: Record<ToastItem['kind'], string> = {
  success: 'border-l-blue-deep',
  error: 'border-l-brand',
  info: 'border-l-gold',
};

function Icon({ kind }: { kind: ToastItem['kind'] }) {
  const common = {
    width: 18,
    height: 18,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2.2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };
  if (kind === 'success') {
    return (
      <svg {...common} className="mt-3 shrink-0 text-blue-deep">
        <path d="m5 12 5 5 9-10" />
      </svg>
    );
  }
  if (kind === 'error') {
    return (
      <svg {...common} className="mt-3 shrink-0 text-brand">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v6M12 16.5v.5" />
      </svg>
    );
  }
  return (
    <svg {...common} className="mt-3 shrink-0 text-gold-deep">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 7.5v.5" />
    </svg>
  );
}

function Card({ item, onClose }: { item: ToastItem; onClose: (id: number) => void }) {
  const [hold, setHold] = useState(false);
  const [dx, setDx] = useState(0);
  const startX = useRef<number | null>(null);

  useEffect(() => {
    if (hold) return;
    const timer = window.setTimeout(() => onClose(item.id), item.kind === 'error' ? 7000 : 4200);
    return () => window.clearTimeout(timer);
  }, [hold, item.id, item.kind, onClose]);

  return (
    <div
      role={item.kind === 'error' ? 'alert' : 'status'}
      onMouseEnter={() => setHold(true)}
      onMouseLeave={() => setHold(false)}
      onFocus={() => setHold(true)}
      onBlur={() => setHold(false)}
      onPointerDown={e => {
        startX.current = e.clientX;
      }}
      onPointerMove={e => {
        if (startX.current !== null) setDx(e.clientX - startX.current);
      }}
      onPointerUp={() => {
        if (Math.abs(dx) > 70) onClose(item.id);
        startX.current = null;
        setDx(0);
      }}
      onPointerCancel={() => {
        startX.current = null;
        setDx(0);
      }}
      style={
        dx
          ? { transform: `translateX(${dx}px)`, opacity: Math.max(0.3, 1 - Math.abs(dx) / 220) }
          : undefined
      }
      className={`toast-in pointer-events-auto flex w-full max-w-md touch-pan-y items-start gap-3 rounded-xl border border-l-4 border-line bg-card pl-4 pr-1 shadow-lg ${ACCENT[item.kind]}`}
    >
      <Icon kind={item.kind} />
      <p className="flex-1 py-3 text-sm">{item.message}</p>
      <button
        type="button"
        onClick={() => onClose(item.id)}
        aria-label="Dismiss message"
        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink-soft hover:bg-sand hover:text-ink"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
          <path d="M6 6l12 12M18 6 6 18" />
        </svg>
      </button>
    </div>
  );
}

export default function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([]);

  const close = useCallback((id: number) => {
    setItems(prev => prev.filter(t => t.id !== id));
  }, []);

  useEffect(() => {
    const off = onToast(item => setItems(prev => [...prev.slice(-(MAX - 1)), item]));
    const original = window.alert;
    window.alert = (message?: unknown) => notify(String(message ?? ''));
    return () => {
      off();
      window.alert = original;
    };
  }, []);

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-4 z-[70] flex flex-col items-center gap-2 px-4"
    >
      {items.map(item => (
        <Card key={item.id} item={item} onClose={close} />
      ))}
    </div>
  );
}