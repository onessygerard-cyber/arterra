'use client';

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ElementType,
  type HTMLAttributes,
  type ReactNode,
} from 'react';

type Props = Omit<HTMLAttributes<HTMLElement>, 'style'> & {
  as?: ElementType;
  delay?: number;
  stagger?: boolean;
  children: ReactNode;
};

export default function Reveal({
  as: Tag = 'div',
  delay = 0,
  stagger = false,
  className = '',
  children,
  ...rest
}: Props) {
  const ref = useRef<HTMLElement | null>(null);
  const [state, setState] = useState<'idle' | 'hidden' | 'shown'>('idle');

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (typeof IntersectionObserver === 'undefined') return;

    if (el.getBoundingClientRect().top < window.innerHeight * 0.92) return;

    setState('hidden');
    const observer = new IntersectionObserver(
      entries => {
        if (entries.some(e => e.isIntersecting)) {
          setState('shown');
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const Component = Tag as ElementType;
  const stateClass =
    state === 'hidden' ? 'reveal-hidden' : state === 'shown' ? 'reveal-shown' : '';

  return (
    <Component
      ref={ref}
      className={`${stagger ? 'reveal-stagger' : ''} ${stateClass} ${className}`}
      style={{ '--reveal-delay': `${delay}ms` } as CSSProperties}
      {...rest}
    >
      {children}
    </Component>
  );
}