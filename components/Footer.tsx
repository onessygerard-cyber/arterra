export default function Footer() {
  const email = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim();
  const whatsapp = process.env.NEXT_PUBLIC_CONTACT_WHATSAPP?.replace(/\D/g, '');
  const link = 'inline-flex items-center min-h-11 underline text-blue-deep';

  return (
    <footer className="border-t border-line mt-16">
      <div className="max-w-4xl mx-auto px-6 py-8 flex flex-wrap items-center justify-between gap-4 text-sm text-ink-soft">
        <p>© {new Date().getFullYear()} ARTERRA</p>
        {(email || whatsapp) && (
          <p className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span>Questions?</span>
            {whatsapp && <a href={`https://wa.me/${whatsapp}`} className={link}>WhatsApp</a>}
            {email && <a href={`mailto:${email}`} className={link}>Email</a>}
          </p>
        )}
      </div>
    </footer>
  );
}