import { createClient } from '@supabase/supabase-js';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';

const TABLES = [
  'artists', 'artworks', 'artwork_inquiries', 'briefs',
  'commissions', 'commission_messages', 'commission_updates', 'reviews',
  'experiences', 'experience_bookings', 'event_enquiries', 'site_settings',
];
const BUCKETS = ['artwork-images', 'brief-references'];
const PAGE = 1000;

function loadEnv() {
  const env = { ...process.env };
  if (existsSync('.env.local')) {
    for (const line of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
      if (m && env[m[1]] === undefined) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
  return env;
}

const env = loadEnv();
if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing. Run this from the arterra folder.');
  process.exit(1);
}

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const withFiles = !process.argv.includes('--no-files');
const stamp = new Date().toISOString().slice(0, 19).replace('T', '_').replace(/:/g, '-');
const root = join('backups', stamp);
mkdirSync(root, { recursive: true });

async function exportTable(table) {
  const rows = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .order(table === 'site_settings' ? 'key' : 'id', { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) return { error };
    rows.push(...data);
    if (data.length < PAGE) break;
  }
  writeFileSync(join(root, `${table}.json`), JSON.stringify(rows, null, 2));
  return { count: rows.length };
}

async function listFiles(bucket, prefix = '') {
  const found = [];
  for (let offset = 0; ; offset += 100) {
    const { data, error } = await supabase.storage.from(bucket).list(prefix, { limit: 100, offset });
    if (error) throw error;
    if (!data || data.length === 0) break;
    for (const item of data) {
      const path = prefix ? `${prefix}/${item.name}` : item.name;
      if (item.id === null) found.push(...(await listFiles(bucket, path)));
      else found.push(path);
    }
    if (data.length < 100) break;
  }
  return found;
}

async function exportBucket(bucket) {
  const paths = await listFiles(bucket);
  let saved = 0;
  for (const path of paths) {
    const { data, error } = await supabase.storage.from(bucket).download(path);
    if (error || !data) {
      console.warn(`  could not download ${bucket}/${path}`);
      continue;
    }
    const target = join(root, 'files', bucket, ...path.split('/'));
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, Buffer.from(await data.arrayBuffer()));
    saved++;
  }
  return { saved, total: paths.length };
}

console.log(`Backing up to ${root}\n`);
let problems = 0;

for (const table of TABLES) {
  const result = await exportTable(table);
  if (result.error) {
    problems++;
    console.warn(`  ${table}: skipped (${result.error.message})`);
  } else {
    console.log(`  ${table}: ${result.count} rows`);
  }
}

if (withFiles) {
  for (const bucket of BUCKETS) {
    try {
      const r = await exportBucket(bucket);
      console.log(`  files in ${bucket}: ${r.saved} of ${r.total}`);
      if (r.saved < r.total) problems++;
    } catch (e) {
      problems++;
      console.warn(`  ${bucket}: skipped (${e.message})`);
    }
  }
}

console.log(
  problems
    ? `\nFinished with ${problems} problem(s). Check the messages above.`
    : '\nDone. Every table and file was saved.'
);