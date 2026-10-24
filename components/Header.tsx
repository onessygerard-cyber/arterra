import Image from 'next/image';
import Link from 'next/link';
import NavLinks from '@/components/NavLinks';

export default function Header() {
  return (
    <header className="sticky top-0 z-30 bg-cream/90 backdrop-blur border-b border-line">
      <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between flex-wrap gap-x-6 gap-y-1">
        <Link href="/" aria-label="ARTERRA home" className="shrink-0">
          <Image
            src="/arterra-logo.png"
            alt="ARTERRA"
            width={800}
            height={233}
            priority
            className="h-12 md:h-14 w-auto"
          />
        </Link>
        <NavLinks />
      </div>
    </header>
  );
}