'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { canOptimize } from '@/lib/image-host';

const DEFAULT_SIZES = '(min-width: 768px) 280px, (min-width: 640px) 45vw, 100vw';

export default function FadeImage({
  src,
  alt,
  className = '',
  sizes = DEFAULT_SIZES,
}: {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
}) {
  const ref = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [optFailed, setOptFailed] = useState(false);
  const optimized = canOptimize(src) && !optFailed;

  useEffect(() => {
    const img = ref.current;
    if (img && img.complete && img.naturalWidth > 0) setLoaded(true);
  }, [src, optimized]);

  return (
    <span
      className={`relative block w-full h-full motion-safe:transition-opacity motion-safe:duration-700 motion-safe:ease-in-out ${
        loaded ? 'opacity-100' : 'opacity-0 motion-reduce:opacity-100'
      }`}
    >
      {optimized ? (
        <Image
          ref={ref}
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          onLoad={() => setLoaded(true)}
          onError={() => setOptFailed(true)}
          className={className}
        />
      ) : (
        <img
          ref={ref}
          src={src}
          alt={alt}
          onLoad={() => setLoaded(true)}
          onError={() => setLoaded(true)}
          className={className}
        />
      )}
    </span>
  );
}