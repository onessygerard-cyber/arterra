import { ROUND_STAGES, STAGE_LABEL } from '@/lib/stages';

export default function RevisionRounds({
  updates,
}: {
  updates: { stage?: string; decision: string }[];
}) {
  return (
    <div className="mb-4">
      <p className="text-xs font-medium text-ink-soft mb-2">Included revision rounds</p>
      <ul className="flex flex-wrap gap-2">
        {ROUND_STAGES.map(s => {
          const used = updates.some(u => u.stage === s && u.decision === 'changes_requested');
          return (
            <li
              key={s}
              className={`text-xs font-medium px-3 py-1 rounded-full border ${
                used ? 'border-ink bg-ink text-cream' : 'border-line text-ink-soft'
              }`}
            >
              {STAGE_LABEL[s]}: {used ? 'used' : 'available'}
            </li>
          );
        })}
      </ul>
    </div>
  );
}