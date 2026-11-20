'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import Link from 'next/link';
import StepProgress from '@/components/StepProgress';

const MEDIUM_OPTIONS = [
  'Painting', 'Drawing', 'Portrait', 'Sculpture',
  'Photography', 'Textile / Fiber art', 'Ceramics', 'Mixed media',
];
const STEPS = ['You', 'Your art', 'Your work', 'Review'];
const LAST = STEPS.length - 1;
const DRAFT_KEY = 'arterra-join-draft';

type Form = {
  name: string;
  contact: string;
  location: string;
  styles: string;
  bio: string;
  portfolio: string;
  priceRange: string;
  turnaround: string;
  shipsTo: string;
};

const EMPTY: Form = {
  name: '', contact: '', location: '', styles: '', bio: '',
  portfolio: '', priceRange: '', turnaround: '', shipsTo: '',
};

const DRAFT_FIELDS = ['styles', 'bio', 'portfolio', 'priceRange', 'turnaround', 'shipsTo'] as const;

const inputClass =
  'w-full min-h-11 border border-line rounded-lg px-4 py-2.5 bg-cream focus:outline-none focus:ring-2 focus:ring-blue/30 focus:border-blue';
const labelClass = 'block text-sm font-medium mb-1';

export default function JoinPage() {
  const [form, setForm] = useState<Form>(EMPTY);
  const [mediums, setMediums] = useState<string[]>([]);
  const [mediumError, setMediumError] = useState('');
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [fromReview, setFromReview] = useState(false);
  const [status, setStatus] = useState<'idle' | 'saving' | 'done' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as Partial<Form> & { mediums?: string[] };
      setForm(prev => {
        const next = { ...prev };
        for (const k of DRAFT_FIELDS) {
          if (typeof saved[k] === 'string') next[k] = saved[k] as string;
        }
        return next;
      });
      if (Array.isArray(saved.mediums)) {
        setMediums(saved.mediums.filter(m => MEDIUM_OPTIONS.includes(m)));
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (status === 'done') return;
    try {
      const draft: Record<string, unknown> = { mediums };
      for (const k of DRAFT_FIELDS) draft[k] = form[k];
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {}
  }, [form, mediums, status]);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [step]);

  const set = (key: keyof Form) => (e: { target: { value: string } }) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }));

  function toggleMedium(m: string) {
    setMediumError('');
    setMediums(prev => (prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]));
  }

  function goTo(next: number) {
    setDir(next > step ? 1 : -1);
    setStep(next);
    setErrorMsg('');
  }

  function editFromReview(target: number) {
    setFromReview(true);
    goTo(target);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (step === 1 && mediums.length === 0) {
      setMediumError('Choose at least one art type.');
      return;
    }
    if (step < LAST) {
      if (fromReview) {
        setFromReview(false);
        goTo(LAST);
      } else {
        goTo(step + 1);
      }
      return;
    }
    void send();
  }

  async function send() {
    if (mediums.length === 0) {
      setErrorMsg('Choose at least one art type.');
      return;
    }
    setStatus('saving');
    setErrorMsg('');
    try {
      const res = await fetch('/api/artists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          mediums,
          styles: form.styles.split(',').map(s => s.trim()).filter(Boolean),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus('error');
        setErrorMsg(data.error || 'Something went wrong. Please try again.');
        return;
      }
      try {
        sessionStorage.removeItem(DRAFT_KEY);
      } catch {}
      setStatus('done');
    } catch {
      setStatus('error');
      setErrorMsg('We could not send that. Check your connection and try again.');
    }
  }

  if (status === 'done') {
    return (
      <main className="max-w-xl mx-auto mt-16 px-6 pb-20">
        <h1 className="text-3xl mb-2">Application received.</h1>
        <p className="text-ink-soft mb-8">
          Thank you. A person on our team will read it, and we will reply using the contact details you gave. We
          can&apos;t email you automatically yet, so keep an eye on your WhatsApp or inbox.
        </p>
        <h2 className="text-lg mb-3">What happens next</h2>
        <ol className="space-y-3 text-sm text-ink-soft mb-10">
          <li><span className="font-mono text-ink">01</span>  We review your work and your details by hand.</li>
          <li><span className="font-mono text-ink">02</span>  If it is a fit, we set up your login and your profile goes live.</li>
          <li><span className="font-mono text-ink">03</span>  You add a photo, a longer bio and your first pieces from your dashboard.</li>
        </ol>
        <Link href="/explore"
          className="inline-flex min-h-11 items-center rounded-lg border border-line bg-card px-5 text-sm font-medium hover:bg-sand">
          Look around the gallery
        </Link>
      </main>
    );
  }

  const saving = status === 'saving';

  const rows: { label: string; value: string; step: number }[] = [
    { label: 'Name', value: form.name, step: 0 },
    { label: 'Contact', value: form.contact, step: 0 },
    { label: 'Location', value: form.location, step: 0 },
    { label: 'Art types', value: mediums.join(', '), step: 1 },
    { label: 'Style', value: form.styles || 'Not given', step: 1 },
    { label: 'About your work', value: form.bio, step: 1 },
    { label: 'Portfolio', value: form.portfolio, step: 2 },
    { label: 'Typical prices', value: form.priceRange, step: 2 },
    { label: 'Typical turnaround', value: form.turnaround, step: 2 },
    { label: 'Ships to', value: form.shipsTo || 'Not given', step: 2 },
  ];

  const primaryLabel =
    step === LAST ? (saving ? 'Sending…' : 'Send application') : fromReview ? 'Back to review' : 'Continue';

  return (
    <main className="max-w-xl mx-auto mt-16 px-6 pb-20">
      <h1 className="text-2xl mb-1">Join as an Artist</h1>
      <p className="text-ink-soft mb-8">We review every application by hand. It takes a few minutes.</p>

      <StepProgress
        steps={STEPS}
        current={step}
        onJump={i => {
          setFromReview(false);
          goTo(i);
        }}
      />

      <form onSubmit={onSubmit} className="bg-card border border-line rounded-xl p-6 shadow-sm sm:p-8">
        <div key={step} className="step-in" style={{ '--dir': dir } as CSSProperties}>
          {step === 0 && (
            <>
              <h2 ref={headingRef} tabIndex={-1} className="mb-1 text-xl outline-none">About you</h2>
              <p className="mb-5 text-sm text-ink-soft">
                Your contact details are seen only by the ARTERRA team.
              </p>
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className={labelClass}>Your name</label>
                  <input id="name" required maxLength={120} autoComplete="name" value={form.name}
                    onChange={set('name')} className={inputClass} />
                </div>
                <div>
                  <label htmlFor="contact" className={labelClass}>Email or WhatsApp</label>
                  <input id="contact" required maxLength={200} autoComplete="email" value={form.contact}
                    onChange={set('contact')} className={inputClass} />
                </div>
                <div>
                  <label htmlFor="location" className={labelClass}>Where are you based?</label>
                  <input id="location" required maxLength={160} placeholder="City, country" value={form.location}
                    onChange={set('location')} className={inputClass} />
                </div>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <h2 ref={headingRef} tabIndex={-1} className="mb-1 text-xl outline-none">Your art</h2>
              <p className="mb-5 text-sm text-ink-soft">What do you make, and how would you describe it?</p>
              <div className="space-y-5">
                <fieldset>
                  <legend className={labelClass}>
                    Art type <span className="font-normal text-ink-soft">(choose all that apply)</span>
                  </legend>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {MEDIUM_OPTIONS.map(m => {
                      const on = mediums.includes(m);
                      return (
                        <label
                          key={m}
                          className={`inline-flex min-h-11 cursor-pointer items-center rounded-full border px-4 text-sm font-medium transition-colors focus-within:ring-2 focus-within:ring-blue/40 ${
                            on ? 'border-brand bg-brand text-cream' : 'border-line text-ink-soft hover:bg-sand'
                          }`}
                        >
                          <input type="checkbox" checked={on} onChange={() => toggleMedium(m)} className="sr-only" />
                          {m}
                        </label>
                      );
                    })}
                  </div>
                  {mediumError && <p role="alert" className="mt-2 text-sm text-red-600">{mediumError}</p>}
                </fieldset>

                <div>
                  <label htmlFor="styles" className={labelClass}>
                    Style <span className="font-normal text-ink-soft">(optional)</span>
                  </label>
                  <input id="styles" placeholder="e.g. Abstract, Realism" value={form.styles}
                    onChange={set('styles')} className={inputClass} />
                </div>

                <div>
                  <label htmlFor="bio" className={labelClass}>A little about your work</label>
                  <textarea id="bio" required minLength={20} maxLength={3000} rows={6}
                    placeholder="How you work, what inspires you, what you are known for."
                    value={form.bio} onChange={set('bio')} className={inputClass} />
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2 ref={headingRef} tabIndex={-1} className="mb-1 text-xl outline-none">Your work</h2>
              <p className="mb-5 text-sm text-ink-soft">Show us where to see your work, and how you usually work.</p>
              <div className="space-y-4">
                <div>
                  <label htmlFor="portfolio" className={labelClass}>Portfolio</label>
                  <textarea id="portfolio" required minLength={5} maxLength={3000} rows={4}
                    placeholder="Links to your website or Instagram, or describe your work."
                    value={form.portfolio} onChange={set('portfolio')} className={inputClass} />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="priceRange" className={labelClass}>Typical prices</label>
                    <input id="priceRange" required maxLength={80} placeholder="e.g. $200–800" value={form.priceRange}
                      onChange={set('priceRange')} className={inputClass} />
                  </div>
                  <div>
                    <label htmlFor="turnaround" className={labelClass}>Typical turnaround</label>
                    <input id="turnaround" required maxLength={80} placeholder="e.g. 3–4 weeks" value={form.turnaround}
                      onChange={set('turnaround')} className={inputClass} />
                  </div>
                </div>
                <div>
                  <label htmlFor="shipsTo" className={labelClass}>
                    Ships to <span className="font-normal text-ink-soft">(optional)</span>
                  </label>
                  <input id="shipsTo" maxLength={120} placeholder="e.g. Worldwide" value={form.shipsTo}
                    onChange={set('shipsTo')} className={inputClass} />
                </div>
              </div>
            </>
          )}

          {step === LAST && (
            <>
              <h2 ref={headingRef} tabIndex={-1} className="mb-1 text-xl outline-none">Check and send</h2>
              <p className="mb-5 text-sm text-ink-soft">
                Here is everything you&apos;ve told us. Change anything with Edit, then send.
              </p>
              <dl className="divide-y divide-line">
                {rows.map(r => (
                  <div key={r.label} className="flex items-start justify-between gap-4 py-3">
                    <div className="min-w-0">
                      <dt className="font-mono text-xs text-ink-soft">{r.label}</dt>
                      <dd className="mt-0.5 whitespace-pre-line break-words text-sm">{r.value}</dd>
                    </div>
                    <button type="button" onClick={() => editFromReview(r.step)}
                      className="min-h-11 shrink-0 text-sm text-blue-deep underline">
                      Edit
                    </button>
                  </div>
                ))}
              </dl>
            </>
          )}
        </div>

        {errorMsg && <p className="mt-5 text-sm text-red-600" role="alert">{errorMsg}</p>}

        <div className="mt-8 flex flex-wrap items-center gap-3">
          {step > 0 && (
            <button
              type="button"
              onClick={() => {
                setFromReview(false);
                goTo(step - 1);
              }}
              disabled={saving}
              className="min-h-11 rounded-full border border-line bg-card px-5 text-sm font-medium hover:bg-sand disabled:opacity-50"
            >
              Back
            </button>
          )}
          <button
            type="submit"
            disabled={saving}
            className={`min-h-11 rounded-lg px-7 font-medium text-cream disabled:opacity-50 ${
              step === LAST ? 'bg-brand hover:bg-brand-deep' : 'bg-ink hover:bg-brand-deep'
            }`}
          >
            {primaryLabel}
          </button>
        </div>
      </form>
    </main>
  );
}