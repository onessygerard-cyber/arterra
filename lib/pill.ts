export const pill =
  'inline-flex items-center justify-center min-h-11 px-4 rounded-full border text-sm font-medium transition-colors';
export const pillIdle = 'border-brand/40 text-brand hover:border-brand hover:bg-brand/5';
export const pillOn = 'border-brand bg-brand text-cream';
export const pillCta = 'border-brand text-brand font-semibold hover:bg-brand hover:text-cream';

export function pillClass(active: boolean): string {
  return `${pill} ${active ? pillOn : pillIdle}`;
}