'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase-browser';
import type { LegalDoc } from '@/lib/legal';

type DocInfo = { key: string; doc: LegalDoc; open: number };
type Payload = { published: boolean; switchOn: boolean; docs: DocInfo[] };

function toText(doc: LegalDoc): string {
  const lines: string[] = [doc.title, `Last updated: ${doc.updated}`, '', ...doc.intro, ''];
  for (const s of doc.sections) {
    lines.push(s.heading);
    (s.paragraphs || []).forEach(p => lines.push(p));
    (s.bullets || []).forEach(b => lines.push(`- ${b}`));
    lines.push('');
  }
  return lines.join('\n');
}

function Highlight({ text }: { text: string }) {
  const parts = text.split(/(\[\[.*?\]\])/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith('[[') ? (
          <mark key={i} className="bg-gold/30 text-ink rounded px-1">{p}</mark>
        ) : (
          <span key={i}>{p}</span>
        )
      )}
    </>
  );
}

export default function LegalDraftsPage() {
  const router = useRouter();
  const [data, setData] = useState<Payload | null>(null);
  const [copied, setCopied] = useState('');

  const load = useCallback(async () => {
    const { data: session } = await supabaseBrowser.auth.getSession();
    if (!session.session) { router.push('/studio/login'); return; }
    const res = await fetch('/api/legal-drafts', {
      headers: { Authorization: `Bearer ${session.session.access_token}` },
    });
    if (res.status === 401) {
      await supabaseBrowser.auth.signOut();
      router.push('/studio/login');
      return;
    }
    setData(await res.json());
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  function copy(key: string, doc: LegalDoc) {
    navigator.clipboard.writeText(toText(doc));
    setCopied(key);
    setTimeout(() => setCopied(''), 2000);
  }

  if (!data) return <main className="max-w-3xl mx-auto mt-16 px-6 text-ink-soft">Loading…</main>;

  return (
    <main className="max-w-3xl mx-auto mt-16 px-6 pb-24">
      <a href="/studio" className="text-sm underline text-blue-deep">Back to Studio</a>
      <h1 className="text-2xl mt-4 mb-6">Terms and Privacy drafts</h1>

      <div className="bg-card border border-line rounded-xl p-5 shadow-sm mb-10 text-sm space-y-1">
        <p><span className="font-medium">Public pages:</span> {data.published ? 'Live' : 'Hidden'}</p>
        <p><span className="font-medium">Publish switch:</span> {data.switchOn ? 'On' : 'Off'}</p>
        {data.docs.map(d => (
          <p key={d.key}>
            <span className="font-medium">{d.doc.title}:</span>{' '}
            {d.open === 0 ? 'no open items' : `${d.open} open items to fill in`}
          </p>
        ))}
        <p className="text-ink-soft pt-2">
          The pages go live only when the switch is on and no open items remain.
        </p>
      </div>

      <div className="space-y-14">
        {data.docs.map(d => (
          <section key={d.key}>
            <div className="flex justify-between items-center gap-3 mb-4">
              <h2 className="text-xl">{d.doc.title}</h2>
              <button onClick={() => copy(d.key, d.doc)}
                className="min-h-11 border border-line bg-card px-4 rounded-lg text-sm font-medium hover:bg-sand">
                {copied === d.key ? 'Copied' : 'Copy as plain text'}
              </button>
            </div>
            <div className="space-y-3 text-sm">
              {d.doc.intro.map((p, i) => <p key={i}><Highlight text={p} /></p>)}
              {d.doc.sections.map(s => (
                <div key={s.heading} className="pt-3">
                  <p className="font-medium">{s.heading}</p>
                  {s.paragraphs?.map((p, i) => <p key={i} className="mt-1"><Highlight text={p} /></p>)}
                  {s.bullets && (
                    <ul className="list-disc pl-5 mt-1 space-y-1">
                      {s.bullets.map((b, i) => <li key={i}><Highlight text={b} /></li>)}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}