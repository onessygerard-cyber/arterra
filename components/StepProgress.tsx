'use client';

export default function StepProgress({
  steps,
  current,
  onJump,
}: {
  steps: string[];
  current: number;
  onJump: (index: number) => void;
}) {
  const last = steps.length - 1;

  return (
    <nav aria-label="Progress" className="mb-8">
      <p className="sr-only" aria-live="polite">
        Step {current + 1} of {steps.length}: {steps[current]}
      </p>
      <ol className="relative flex items-start justify-between">
        <span aria-hidden="true" className="absolute left-8 right-8 top-[22px] h-px bg-line" />
        <span
          aria-hidden="true"
          className="absolute left-8 top-[22px] h-px bg-brand motion-safe:transition-[width] motion-safe:duration-500 motion-safe:ease-out"
          style={{ width: `calc((100% - 4rem) * ${current / last})` }}
        />
        {steps.map((label, i) => {
          const done = i < current;
          const isCurrent = i === current;
          return (
            <li
              key={label}
              aria-current={isCurrent ? 'step' : undefined}
              className="relative z-10 flex w-16 flex-col items-center"
            >
              <button
                type="button"
                disabled={i > current}
                onClick={() => onJump(i)}
                aria-label={`Step ${i + 1}: ${label}${done ? ', completed' : ''}`}
                className="inline-flex h-11 w-11 items-center justify-center disabled:cursor-default"
              >
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full border text-sm font-medium transition-colors ${
                    done
                      ? 'border-brand bg-brand text-cream'
                      : isCurrent
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
              <span className={`mt-0.5 text-xs ${isCurrent ? 'font-semibold text-ink' : 'text-ink-soft'}`}>
                {label}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}