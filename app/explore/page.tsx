import { supabaseAdmin } from '@/lib/supabase-admin';

export default async function ExplorePage() {
  const { data: artists } = await supabaseAdmin
    .from('artists')
    .select('*')
    .eq('status', 'verified');

  return (
    <main className="max-w-4xl mx-auto mt-16 px-6 pb-16">
           <h1 className="text-2xl mb-1">Explore Artists</h1>
      <p className="text-ink-soft mb-8">{artists?.length || 0} verified</p>

      {(!artists || artists.length === 0) && (
        <div className="border border-dashed border-line rounded-xl p-10 text-center text-ink-soft bg-card/50">
          No artists yet. Applications are reviewed by hand.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {artists?.map(a => (
          <div key={a.id} className="bg-card border border-line rounded-xl p-6 shadow-sm">
            <h3 className="font-display text-lg mb-0.5">{a.name}</h3>
            <p className="text-sm text-ink-soft mb-3">{a.location}</p>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {a.mediums?.map((m: string) => (
                <span key={m} className="text-xs bg-blue/10 text-blue-deep px-2.5 py-1 rounded-full font-medium">{m}</span>
              ))}
            </div>
            <p className="text-sm text-ink-soft mb-4">{a.bio}</p>
            <p className="text-sm font-mono">From {a.price_range}</p>
          </div>
        ))}
      </div>
    </main>
  );
}