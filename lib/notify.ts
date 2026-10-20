export async function notifyAdmin(subject: string, lines: string[]) {
  const key = process.env.RESEND_API_KEY;
  const to = (process.env.NOTIFY_EMAIL || process.env.ADMIN_EMAIL || '').trim();
  if (!key || !to) return;

  const base =
    process.env.SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : '');
  const text = [...lines, base ? `\nOpen Studio: ${base}/studio` : ''].join('\n');

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: 'ARTERRA <onboarding@resend.dev>', to: [to], subject, text }),
      signal: controller.signal,
    });
    clearTimeout(timer);
  } catch {
    // An alert must never break a form.
  }
}