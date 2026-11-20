export type ToastKind = 'success' | 'error' | 'info';
export type ToastItem = { id: number; kind: ToastKind; message: string };
type Listener = (item: ToastItem) => void;

const listeners = new Set<Listener>();
let counter = 0;

export function onToast(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function toast(message: string, kind: ToastKind = 'info'): void {
  const text = message.trim();
  if (!text) return;
  const item: ToastItem = { id: ++counter, kind, message: text };
  listeners.forEach(listener => listener(item));
}

export function notify(message: string): void {
  const m = message.toLowerCase();
  let kind: ToastKind = 'error';
  if (/copied|saved\b|updated\b/.test(m)) kind = 'success';
  else if (/^(no |nothing|every )/.test(m)) kind = 'info';
  toast(message, kind);
}