'use client';

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import Link from 'next/link';
import { shrinkImage } from '@/lib/shrink-image';

const MEDIUMS = [
  'Painting', 'Drawing', 'Portrait', 'Sculpture', 'Photography',
  'Textile / Fiber art', 'Ceramics', 'Mixed media', 'Not sure yet',
];
const STYLES = ['Abstract', 'Contemporary realism', 'Landscape', 'Still life', 'Other', 'Not sure yet'];
const STEPS = ['Idea', 'Details', 'You', 'Review'];
const LAST = STEPS.length - 1;
const MAX_IMAGES = 4;
const MAX_BYTES = 4 * 1024 * 1024;
const OK_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const DRAFT_KEY = 'arterra-commission-draft';

type Form = {
  buyerName: string;
  buyerContact: string;
  description: string;
  medium: string;
  style: string;
  size: string;
  budget: string;
  deadline: string;
  location: string;
  notes: string;
};

const EMPTY: Form = {
  buyerName: '',
  buyerContact: '',
  description: '',
  medium: 'Not sure yet',
  style: 'Not sure yet',
  size: '',
  budget: '',
  deadline: '',
  location: '',
  notes: '',
};

const DRAFT_FIELDS = [
  'description', 'medium', 'style', 'size', 'budget', 'deadline', 'location', 'notes',
] as const;

const inputClass =
  'w-full min-h-11 border border-line rounded-lg px-4 py-2.5 bg-cream focus:outline-none focus:ring-2 focus:ring-blue/30 focus:border-blue';
const labelClass = 'block text-sm font-medium mb-1';

function prettyDate(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  return isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function CommissionPage() {
  const [form, setForm] = useState<Form>(EMPTY);
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [fromReview, setFromReview] = useState(false);
  const [refFiles, setRefFiles] = useState<File[]>([]);
  const [refError, setRefError] = useState('');
  const [refBusy, setRefBusy] = useState(false);
  const [status, setStatus] = useState<'idle' | 'saving' | 'done' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [progress, setProgress] = useState('');
  const [trackToken, setTrackToken] = useState('');
  const [copied, setCopied] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);

  const today = new Date().toLocaleDateString('en-CA');
  const previews = useMemo(() => refFiles.map(f => URL.createObjectURL(f)), [refFiles]);

  useEffect(() => {
    return () => previews.forEach(u => URL.revokeObjectURL(u));
  }, [previews]);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as Partial<Form>;
      setForm(prev => {
        const next = { ...prev };
        for (const k of DRAFT_FIELDS) {
          if (typeof saved[k] === 'string') next[k] = saved[k] as string;
        }
        return next;
      });
    } catch {}
  }, []);

  useEffect(() => {
    if (status === 'done') return;
    try {
      const draft: Record<string, string> = {};
      for (const k of DRAFT_FIELDS) draft[k] = form[k];
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {}
  }, [form, status]);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [step]);

  const set = (key: keyof Form) => (e: { target: { value: string } }) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }));

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

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.currentTarget;
    const originals = Array.from(input.files || []);
    input.value = '';
    setRefError('');
    if (originals.length === 0) return;

    setRefBusy(true);
    const picked = await Promise.all(originals.map(f => shrinkImage(f)));
    setRefBusy(false);

    const badType = picked.find(f => !OK_TYPES.includes(f.type));
    if (badType) {
      setRefError(`"${badType.name}" is not a JPG, PNG or WebP image.`);
      return;
    }
    const tooBig = picked.find(f => f.size > MAX_BYTES);
    if (tooBig) {
      setRefError(`"${tooBig.name}" is still over 4 MB after resizing. Please choose a different image.`);
      return;
    }
    const combined = [...refFiles, ...picked];
    if (combined.length > MAX_IMAGES) setRefError(`You can add up to ${MAX_IMAGES} images.`);
    setRefFiles(combined.slice(0, MAX_IMAGES));
  }

  function removeFile(index: number) {
    setRefFiles(prev => prev.filter((_, i) => i !== index));
    setRefError('');
  }

  async function send() {
    setStatus('saving');
    setErrorMsg('');
    try {
      const referenceImages: string[] = [];
      for (let i = 0; i < refFiles.length; i++) {
        setProgress(`Uploading image ${i + 1} of ${refFiles.length}…`);
        const upload = new FormData();
        upload.append('file', refFiles[i]);
        const upRes = await fetch('/api/upload-reference', { method: 'POST', body: upload });
        const upData = await upRes.json().catch(() => ({}));
        if (!upRes.ok) {
          setStatus('error');
          setErrorMsg(upData.error || 'An image failed to upload. Please try again.');
          return;
        }
        referenceImages.push(upData.path);
      }

      setProgress('Sending your request…');
      const res = await fetch('/api/briefs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, referenceImages }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.brief?.track_token) {
        setStatus('error');
        setErrorMsg(data.error || 'Something went wrong. Please try again.');
        return;
      }

      try {
        sessionStorage.removeItem(DRAFT_KEY);
      } catch {}
      setTrackToken(data.brief.track_token);
      setStatus('done');
    } catch {
      setStatus('error');
      setErrorMsg('We could not send that. Check your connection and try again.');
    } finally {
      setProgress('');
    }
  }

  if (status === 'done') {
    const path = `/track?token=${trackToken}`;
    const fullUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}${path}`;
    return (
      <main className="max-w-xl mx-auto mt-16 px-6 pb-20">
        <h1 className="text-3xl mb-2">Request received.</h1>
        <p className="text-ink-soft mb-8">
          Thank you. We&apos;ll match you with an artist by hand and put a quote on your tracking page.
        </p>

        <div className="bg-card border border-line rounded-xl p-6 shadow-sm mb-8">
          <p className="text-sm font-medium mb-1">Save this link</p>
          <p className="text-xs text-ink-soft mb-3">
            It is the only way back to your request, because we can&apos;t email you yet. Bookmark it or copy it
            somewhere safe, and keep it private.
          </p>
          <Link href={path} className="text-sm text-blue-deep underline break-all">{fullUrl}</Link>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(fullUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="min-h-11 rounded-lg border border-line bg-card px-5 text-sm font-medium hover:bg-sand"
            >
              {copied ? 'Copied' : 'Copy link'}
            </button>
            <Link
              href={path}
              className="inline-flex min-h-11 items-center rounded-lg bg-ink px-5 text-sm font-medium text-cream hover:bg-brand-deep"
            >
              Open my tracking page
            </Link>
          </div>
        </div>

        <h2 className="text-lg mb-3">What happens next</h2>
        <ol className="space-y-3 text-sm text-ink-soft">
          <li><span className="font-mono text-ink">01</span>  We read your request and pick artists who suit it.</li>
          <li><span className="font-mono text-ink">02</span>  You&apos;ll see a price and timeline on your tracking page.</li>
          <li><span className="font-mono text-ink">03</span>  Once you agree, the artist begins, and you can follow progress and message them there.</li>
        </ol>
      </main>
    );
  }

  const saving = status === 'saving';

  const rows: { label: string; value: string; step: number }[] = [
    { label: 'Your idea', value: form.description, step: 0 },
    { label: 'Art type and style', value: `${form.medium} · ${form.style}`, step: 0 },
    { label: 'Size', value: form.size || 'Not given', step: 1 },
    { label: 'Budget', value: form.budget || 'Not given', step: 1 },
    { label: 'Deadline', value: form.deadline ? prettyDate(form.deadline) : 'Not given', step: 1 },
    { label: 'Delivery', value: form.location || 'Not given', step: 1 },
    { label: 'Name', value: form.buyerName, step: 2 },
    { label: 'Contact', value: form.buyerContact, step: 2 },
    { label: 'Notes', value: form.notes || 'None', step: 2 },
  ];

  const primaryLabel =
    step === LAST ? (saving ? 'Sending…' : 'Send request') : fromReview ? 'Back to review' : 'Continue';

  return (
    <main className="max-w-xl mx-auto mt-16 px-6 pb-20">
      <h1 className="text-2xl mb-1">Request a Commission</h1>
      <p className="text-ink-soft mb-8">Tell us what you&apos;re picturing. It takes a few minutes.</p>

      <nav aria-label="Progress" className="mb-8">
        <p className="sr-only" aria-live="polite">
          Step {step + 1} of {STEPS.length}: {STEPS[step]}
        </p>
        <ol className="relative flex items-start justify-between">
          <span aria-hidden="true" className="absolute left-8 right-8 top-[22px] h-px bg-line" />
          <span
            aria-hidden="true"
            className="absolute left-8 top-[22px] h-px bg-brand motion-safe:transition-[width] motion-safe:duration-500 motion-safe:ease-out"
            style={{ width: `calc((100% - 4rem) * ${step / LAST})` }}
          />
          {STEPS.map((label, i) => {
            const done = i < step;
            const current = i === step;
            return (
              <li
                key={label}
                aria-current={current ? 'step' : undefined}
                className="relative z-10 flex w-16 flex-col items-center"
              >
                <button
                  type="button"
                  disabled={i > step}
                  onClick={() => {
                    setFromReview(false);
                    goTo(i);
                  }}
                  aria-label={`Step ${i + 1}: ${label}${done ? ', completed' : ''}`}
                  className="inline-flex h-11 w-11 items-center justify-center disabled:cursor-default"
                >
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full border text-sm font-medium transition-colors ${
                      done
                        ? 'border-brand bg-brand text-cream'
                        : current
                          ? 'border-brand bg-card text-brand ring-4 ring-brand/15'
                          : 'border-line bg-card text-ink-soft'
                    }`}
                  >
                    {done ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="m5 12 5 5 9-10" />
                      </svg>
                    ) : (
                      i + 1
                    )}
                  </span>
                </button>
                <span className={`mt-0.5 text-xs ${current ? 'font-semibold text-ink' : 'text-ink-soft'}`}>
                  {label}
                </span>
              </li>
            );
          })}
        </ol>
      </nav>

      <form onSubmit={onSubmit} className="bg-card border border-line rounded-xl p-6 shadow-sm sm:p-8">
        <div key={step} className="step-in" style={{ '--dir': dir } as CSSProperties}>
          {step === 0 && (
            <>
              <h2 ref={headingRef} tabIndex={-1} className="mb-1 text-xl outline-none">
                What are you picturing?
              </h2>
              <p className="mb-5 text-sm text-ink-soft">
                Describe the piece in your own words: the subject, the mood, the colours, who it&apos;s for.
              </p>
              <label htmlFor="description" className="sr-only">Describe the piece</label>
              <textarea
                id="description"
                required
                minLength={10}
                maxLength={4000}
                rows={6}
                placeholder="For example: a portrait of my grandmother in her garden, warm light, soft colours."
                value={form.description}
                onChange={set('description')}
                className={inputClass}
              />
              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="medium" className={labelClass}>Art type</label>
                  <select id="medium" value={form.medium} onChange={set('medium')} className={inputClass}>
                    {MEDIUMS.map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="style" className={labelClass}>Style</label>
                  <select id="style" value={form.style} onChange={set('style')} className={inputClass}>
                    {STYLES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <h2 ref={headingRef} tabIndex={-1} className="mb-1 text-xl outline-none">
                Size, budget and timing
              </h2>
              <p className="mb-5 text-sm text-ink-soft">
                All optional, but the more you tell us, the better the match.
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="size" className={labelClass}>Approximate size</label>
                  <input id="size" maxLength={120} placeholder="e.g. 100 × 80 cm" value={form.size}
                    onChange={set('size')} className={inputClass} />
                </div>
                <div>
                  <label htmlFor="budget" className={labelClass}>Budget</label>
                  <input id="budget" maxLength={120} placeholder="e.g. $400–700" value={form.budget}
                    onChange={set('budget')} className={inputClass} />
                </div>
                <div>
                  <label htmlFor="deadline" className={labelClass}>Needed by</label>
                  <input id="deadline" type="date" min={today} value={form.deadline}
                    onChange={set('deadline')} className={inputClass} />
                </div>
                <div>
                  <label htmlFor="location" className={labelClass}>Delivery location</label>
                  <input id="location" maxLength={160} placeholder="City, country" value={form.location}
                    onChange={set('location')} className={inputClass} />
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2 ref={headingRef} tabIndex={-1} className="mb-1 text-xl outline-none">
                About you
              </h2>
              <p className="mb-5 text-sm text-ink-soft">
                Your contact details are seen only by the ARTERRA team. Your matched artist sees your name, your
                request and your reference images.
              </p>
              <div className="space-y-4">
                <div>
                  <label htmlFor="buyerName" className={labelClass}>Your name</label>
                  <input id="buyerName" required maxLength={120} autoComplete="name" value={form.buyerName}
                    onChange={set('buyerName')} className={inputClass} />
                </div>
                <div>
                  <label htmlFor="buyerContact" className={labelClass}>Email or WhatsApp</label>
                  <input id="buyerContact" required maxLength={200} autoComplete="email" value={form.buyerContact}
                    onChange={set('buyerContact')} className={inputClass} />
                </div>
                <div>
                  <label htmlFor="notes" className={labelClass}>
                    Anything else? <span className="font-normal text-ink-soft">(optional)</span>
                  </label>
                  <textarea id="notes" rows={3} maxLength={2000} placeholder="Colours, mood, references"
                    value={form.notes} onChange={set('notes')} className={inputClass} />
                </div>

                <div>
                  <p className={labelClass}>
                    Reference images <span className="font-normal text-ink-soft">(optional, up to {MAX_IMAGES})</span>
                  </p>
                  <p className="mb-2 text-xs text-ink-soft">
                    Photos, sketches or inspiration. Large photos are resized for you.
                  </p>
                  <label
                    className={`inline-flex min-h-11 cursor-pointer items-center rounded-lg border border-line bg-cream px-5 text-sm font-medium hover:bg-sand focus-within:ring-2 focus-within:ring-blue/30 ${
                      refFiles.length >= MAX_IMAGES || refBusy ? 'pointer-events-none opacity-50' : ''
                    }`}
                  >
                    {refBusy ? 'Preparing…' : 'Add images'}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      onChange={handleFiles}
                      disabled={refFiles.length >= MAX_IMAGES || refBusy}
                      className="sr-only"
                    />
                  </label>
                  {refError && <p className="mt-2 text-sm text-red-600" role="alert">{refError}</p>}
                  {refFiles.length > 0 && (
                    <ul className="mt-3 flex flex-wrap gap-3">
                      {refFiles.map((f, i) => (
                        <li key={`${f.name}-${i}`} className="w-20">
                          <img src={previews[i]} alt={`Reference ${i + 1}`}
                            className="h-20 w-20 rounded-lg border border-line object-cover" />
                          <button type="button" onClick={() => removeFile(i)}
                            className="min-h-11 text-xs text-ink-soft underline hover:text-ink">
                            Remove
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </>
          )}

          {step === LAST && (
            <>
              <h2 ref={headingRef} tabIndex={-1} className="mb-1 text-xl outline-none">
                Check and send
              </h2>
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
                <div className="flex items-start justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <dt className="font-mono text-xs text-ink-soft">Reference images</dt>
                    <dd className="mt-1">
                      {refFiles.length === 0 ? (
                        <span className="text-sm">None</span>
                      ) : (
                        <ul className="flex flex-wrap gap-2">
                          {previews.map((u, i) => (
                            <li key={u}>
                              <img src={u} alt={`Reference ${i + 1}`}
                                className="h-14 w-14 rounded-md border border-line object-cover" />
                            </li>
                          ))}
                        </ul>
                      )}
                    </dd>
                  </div>
                  <button type="button" onClick={() => editFromReview(2)}
                    className="min-h-11 shrink-0 text-sm text-blue-deep underline">
                    Edit
                  </button>
                </div>
              </dl>
            </>
          )}
        </div>

        {errorMsg && (
          <p className="mt-5 text-sm text-red-600" role="alert">{errorMsg}</p>
        )}
        {progress && (
          <p className="mt-5 text-sm text-ink-soft" aria-live="polite">{progress}</p>
        )}

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
            disabled={saving || refBusy}
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