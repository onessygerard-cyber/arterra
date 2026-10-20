export default function ShareLinks({
  title,
  artist,
  image,
  url,
}: {
  title: string;
  artist: string;
  image?: string | null;
  url: string;
}) {
  const text = `${title} by ${artist} on ARTERRA`;
  const whatsapp = `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`;
  const pinterest =
    `https://www.pinterest.com/pin/create/button/?url=${encodeURIComponent(url)}` +
    `&media=${encodeURIComponent(image || '')}&description=${encodeURIComponent(text)}`;
  const link = 'inline-flex items-center min-h-11 text-sm text-ink-soft underline hover:text-ink';

  return (
    <div className="flex flex-wrap gap-x-5">
      <a href={whatsapp} target="_blank" rel="noopener noreferrer" className={link}>
        Share on WhatsApp
      </a>
      {image && (
        <a href={pinterest} target="_blank" rel="noopener noreferrer" className={link}>
          Pin on Pinterest
        </a>
      )}
    </div>
  );
}