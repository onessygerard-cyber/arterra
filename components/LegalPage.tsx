import type { LegalDoc } from '@/lib/legal';

export default function LegalPage({ doc }: { doc: LegalDoc }) {
  return (
    <main className="max-w-2xl mx-auto mt-16 px-6 pb-24">
      <h1 className="text-3xl mb-2">{doc.title}</h1>
      <p className="font-mono text-xs text-ink-soft mb-8">Last updated: {doc.updated}</p>

      <div className="space-y-4 mb-10">
        {doc.intro.map((p, i) => (
          <p key={i} className="text-ink">{p}</p>
        ))}
      </div>

      <div className="space-y-10">
        {doc.sections.map(s => (
          <section key={s.heading}>
            <h2 className="text-xl mb-3">{s.heading}</h2>
            {s.paragraphs?.map((p, i) => (
              <p key={i} className="text-ink mb-3">{p}</p>
            ))}
            {s.bullets && (
              <ul className="list-disc pl-5 space-y-2 text-ink">
                {s.bullets.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </main>
  );
}