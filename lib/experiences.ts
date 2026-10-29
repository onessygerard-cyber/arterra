export const FORMATS = ['in_person', 'online'] as const;
export const SKILLS = ['all', 'beginner', 'intermediate', 'advanced'] as const;

export const FORMAT_LABEL: Record<string, string> = { in_person: 'In person', online: 'Online' };
export const SKILL_LABEL: Record<string, string> = {
  all: 'All levels',
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};
export const STATUS_LABEL: Record<string, string> = {
  pending: 'Waiting for review',
  published: 'Live',
  rejected: 'Not accepted',
  cancelled: 'Cancelled',
  completed: 'Completed',
};

export type ExperienceFields = {
  title: string;
  description: string;
  format: string;
  skill_level: string;
  event_date: string;
  start_time: string;
  duration_minutes: number;
  location: string;
  private_details: string;
  price: string;
  capacity: number;
  min_attendees: number;
  includes: string;
  bring: string;
  image_url: string | null;
};

export const LOCKED_WHEN_LIVE: (keyof ExperienceFields)[] = [
  'title', 'format', 'skill_level', 'event_date', 'start_time', 'duration_minutes',
  'location', 'price', 'capacity', 'min_attendees',
];

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

function clean(value: unknown, max: number): string {
  return String(value ?? '').trim().slice(0, max);
}

function whole(value: unknown): number {
  const n = Number(value);
  return Number.isInteger(n) ? n : NaN;
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function formatDate(iso: string): string {
  const d = new Date(`${iso}T12:00:00Z`);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
  });
}

export function formatTime(t: string): string {
  return (t || '').slice(0, 5);
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} hr` : `${h} hr ${m} min`;
}

export function shortText(text: string | null | undefined, max: number): string {
  const t = (text || '').replace(/\s+/g, ' ').trim();
  return t.length > max ? t.slice(0, max - 1).trimEnd() + '…' : t;
}

export type Parsed = { ok: true; fields: ExperienceFields } | { ok: false; error: string };

function fail(error: string): Parsed {
  return { ok: false, error };
}

export function parseExperience(
  body: Record<string, unknown>,
  imagePrefix: string,
  requireFuture: boolean
): Parsed {
  const title = clean(body.title, 120);
  const description = clean(body.description, 3000);
  const format = clean(body.format, 20);
  const skill = clean(body.skill_level, 20);
  const date = clean(body.event_date, 10);
  const time = clean(body.start_time, 8).slice(0, 5);
  const duration = whole(body.duration_minutes);
  const location = clean(body.location, 160);
  const price = clean(body.price, 60);
  const capacity = whole(body.capacity);
  const min = whole(body.min_attendees ?? 1);
  const image = clean(body.image_url, 1000);

  if (!title) return fail('Add a title.');
  if (!description) return fail('Describe what people will do.');
  if (!(FORMATS as readonly string[]).includes(format)) return fail('Choose in person or online.');
  if (!(SKILLS as readonly string[]).includes(skill)) return fail('Choose a skill level.');

  const parsedDate = new Date(`${date}T00:00:00Z`);
  if (!DATE_RE.test(date) || isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== date) {
    return fail('Choose a valid date.');
  }
  if (requireFuture && date < todayIso()) return fail('The date must be today or later.');
  if (!TIME_RE.test(time)) return fail('Choose a start time.');
  if (!Number.isInteger(duration) || duration < 15 || duration > 720) {
    return fail('The duration must be between 15 minutes and 12 hours.');
  }
  if (!location) {
    return fail(format === 'online' ? 'Say where it happens, for example "Online".' : 'Add the venue and city.');
  }
  if (!price) return fail('Add a price, or write "Free".');
  if (!Number.isInteger(capacity) || capacity < 1 || capacity > 100) {
    return fail('The number of seats must be between 1 and 100.');
  }
  if (!Number.isInteger(min) || min < 1 || min > capacity) {
    return fail('The minimum must be between 1 and the number of seats.');
  }
  if (image && !image.startsWith(imagePrefix)) {
    return fail('The cover image is not valid. Please upload it again.');
  }

  return {
    ok: true,
    fields: {
      title,
      description,
      format,
      skill_level: skill,
      event_date: date,
      start_time: time,
      duration_minutes: duration,
      location,
      private_details: clean(body.private_details, 1000),
      price,
      capacity,
      min_attendees: min,
      includes: clean(body.includes, 1000),
      bring: clean(body.bring, 1000),
      image_url: image || null,
    },
  };
}