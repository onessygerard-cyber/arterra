'use client';

import { useState } from 'react';
import Image from 'next/image';
import { canOptimize } from '@/lib/image-host';

export default function Avatar({
  name,
  src,
  size = 56,
}: {
  name: string;
  src?: string | null;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);

  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('');

  if (src) {
    const cls = 'rounded-full object-cover border border-line shrink-0';
    if (canOptimize(src) && !failed) {
      return (
        <Image
          src={src}
          alt=""
          width={size}
          height={size}
          sizes={`${size}px`}
          onError={() => setFailed(true)}
          style={{ width: size, height: size }}
          className={cls}
        />
      );
    }
    return (
      <img
        src={src}
        alt=""
        width={size}
        height={size}
        style={{ width: size, height: size }}
        className={cls}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }}
      className="rounded-full bg-sand text-ink-soft flex items-center justify-center font-display shrink-0"
    >
      {initials}
    </span>
  );
}