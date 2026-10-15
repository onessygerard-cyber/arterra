'use client';

import { useEffect, useRef, useState } from 'react';

export default function FadeImage({
  src,
  alt,
  className = '',
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const ref = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const img = ref.current;
    if (img && img.complete && img.naturalWidth > 0) setLoaded(true);
  }, [src]);

  return (
    <span
      className={`block w-full h-full motion-safe:transition-opacity motion-safe:duration-700 motion-safe:ease-in-out ${
        loaded ? 'opacity-100' : 'opacity-0 motion-reduce:opacity-100'
      }`}
    >
      <img
        ref={ref}
        src={src}
        alt={alt}
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
        className={className}
      />
    </span>
  );
}