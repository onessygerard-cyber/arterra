'use client';

import Link from 'next/link';
import FadeImage from '@/components/FadeImage';
import AvailabilityMark from '@/components/AvailabilityMark';
import { masonryItemRef, ratioStyle } from '@/lib/masonry';

export type FeaturedItem = {
  id: string;
  title: string;
  price: string;
  image_url: string | null;
  image_width: number | null;
  image_height: number | null;
  artist_id: string;
  artist: string;
  type: string;
  status: string;
};

export default function FeaturedGrid({ items }: { items: FeaturedItem[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-10 gap-y-0 auto-rows-[8px] grid-flow-dense items-start">
      {items.map(a => (
        <Link
          key={a.id}
          href={`/artist/${a.artist_id}?piece=${a.id}`}
          ref={masonryItemRef}
          className="group block"
        >
          <div style={ratioStyle(a.image_width, a.image_height)}>
            {a.image_url ? (
              <FadeImage
                src={a.image_url}
                alt=""
                className="w-full h-full object-contain drop-shadow-sm motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-out motion-safe:group-hover:scale-[1.015]"
              />
            ) : (
              <div className="w-full h-full bg-sand" />
            )}
          </div>
          <span className="block mt-4 font-display text-lg leading-snug">{a.title}</span>
          <span className="block text-xs text-ink-soft mt-1">
            {a.artist} · {a.type === 'original' ? 'Original' : 'Print'}
          </span>
          <span className="block text-sm font-medium mt-2">
            {a.price} <AvailabilityMark status={a.status} className="ml-2 align-middle" />
          </span>
        </Link>
      ))}
    </div>
  );
}