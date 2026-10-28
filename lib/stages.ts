export const STAGES = ['concept', 'sketch', 'colours', 'final', 'update'] as const;
export type Stage = (typeof STAGES)[number];

export const ROUND_STAGES: Stage[] = ['concept', 'sketch', 'colours'];

export const STAGE_LABEL: Record<Stage, string> = {
  concept: 'Concept',
  sketch: 'Sketch',
  colours: 'Preliminary colours',
  final: 'Final artwork',
  update: 'Progress update',
};

export function isStage(value: unknown): value is Stage {
  return typeof value === 'string' && (STAGES as readonly string[]).includes(value);
}

export function isRoundStage(stage: string): boolean {
  return ROUND_STAGES.includes(stage as Stage);
}