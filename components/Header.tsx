import Link from "next/link";

export default function Header() {
  return (
    <header className="sticky top-0 z-20 bg-cream/90 backdrop-blur border-b border-line">
      <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between flex-wrap gap-3">
        <Link href="/" className="font-display italic font-600 text-xl text-ink">
          ARTERRA
        </Link>
       <nav className="flex items-center gap-1 flex-wrap">
  <Link href="/explore" className="text-sm font-medium px-3 py-2 rounded-full hover:bg-sand text-ink-soft hover:text-ink">
    Explore
  </Link>
  <Link href="/commission" className="text-sm font-medium px-3 py-2 rounded-full hover:bg-sand text-ink-soft hover:text-ink">
    Commission
  </Link>
  <Link href="/join" className="text-sm font-medium px-3 py-2 rounded-full hover:bg-sand text-ink-soft hover:text-ink">
    Register
  </Link>
  <Link href="/artist-login" className="text-sm font-medium px-3 py-2 rounded-full hover:bg-sand text-ink-soft hover:text-ink">
    Artist Login
  </Link>
  <Link href="/studio" className="text-xs font-medium px-3 py-2 rounded-full text-ink-soft/70 hover:text-ink-soft">
    Studio
  </Link>
</nav>
      </div>
    </header>
  );
}