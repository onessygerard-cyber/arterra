import Image from 'next/image';
import { canOptimize } from '@/lib/image-host';

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('');
}

export default function ArtistPortrait({
  name,
  src,
  className = '',
  lazy = false,
  decorative = false,
}: {
  name: string;
  src?: string | null;
  className?: string;
  lazy?: boolean;
  decorative?: boolean;
}) {
  const alt = decorative ? '' : `Portrait of ${name}`;
  const loading = lazy ? 'lazy' : 'eager';

  return (
    <div
      className={`relative aspect-[3/4] overflow-hidden rounded-t-full border border-line bg-sand ${className}`}
    >
      {src ? (
        canOptimize(src) ? (
          <Image
            src={src}
            alt={alt}
            fill
            sizes="(min-width: 768px) 280px, 192px"
            loading={loading}
            className="object-cover"
          />
        ) : (
          <img
            src={src}
            alt={alt}
            loading={loading}
            className="absolute inset-0 h-full w-full object-cover"
          />
        )
      ) : (
        <span
          aria-hidden="true"
          className="absolute inset-0 flex items-center justify-center font-display text-6xl text-ink-soft"
        >
          {initials(name)}
        </span>
      )}
    </div>
  );
}