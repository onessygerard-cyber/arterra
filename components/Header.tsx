import Image from 'next/image';
import Link from 'next/link';
import NavLinks from '@/components/NavLinks';

export default function Header() {
  return (
    <header className="sticky top-0 z-30 bg-cream/90 backdrop-blur border-b border-line">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-x-6 gap-y-1">
        <Link href="/" aria-label="ARTERRA home" className="shrink-0">
          <Image
            src="/arterra-logo.png"
            alt="ARTERRA"
            width={800}
            height={233}
            priority
            className="h-10 sm:h-12 lg:h-14 w-auto dark:hidden"
          />
          <Image
            src="/arterra-logo-light.png"
            alt="ARTERRA"
            width={800}
            height={233}
            loading="lazy"
            className="hidden h-10 sm:h-12 lg:h-14 w-auto dark:block"
          />
        </Link>
        <NavLinks />
      </div>
    </header>
  );
}