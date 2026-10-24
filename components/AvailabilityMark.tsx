export default function AvailabilityMark({
  status,
  className = '',
}: {
  status: string;
  className?: string;
}) {
  if (status === 'sold') {
    return (
      <span className={`inline-flex items-center rounded-full bg-ink px-2.5 py-0.5 text-xs font-semibold text-cream ${className}`}>
        Sold
      </span>
    );
  }
  if (status === 'approved') {
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full border border-blue-deep px-2.5 py-0.5 text-xs font-semibold text-blue-deep ${className}`}>
        <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-blue-deep" />
        Available
      </span>
    );
  }
  return null;
}