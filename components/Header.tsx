import Image from "next/image";
import Link from "next/link";

const navLink =
  "text-sm font-medium px-3 py-2 rounded-full hover:bg-sand text-ink-soft hover:text-ink";

export default function Header() {
  return (
    <header className="sticky top-0 z-20 bg-cream/90 backdrop-blur border-b border-line">
      <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between flex-wrap gap-3">
        <Link href="/" aria-label="ARTERRA home">
          <Image
            src="/arterra-logo.png"
            alt="ARTERRA"
            width={800}
            height={233}
            priority
            className="h-12 md:h-14 w-auto"
          />
        </Link>
        <nav className="flex items-center gap-1 flex-wrap">
          <Link href="/explore" className={navLink}>Explore</Link>
          <Link href="/commission" className={navLink}>Commission</Link>
          <Link href="/join" className={navLink}>Register</Link>
          <Link href="/artist-login" className={navLink}>Artist Login</Link>
          <Link href="/studio" className="text-xs font-medium px-3 py-2 rounded-full text-ink-soft/70 hover:text-ink-soft">
            Studio
          </Link>
        </nav>
      </div>
    </header>
  );
}