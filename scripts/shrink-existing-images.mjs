import { createClient } from '@supabase/supabase-js';
import {
  existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync,
} from 'fs';
import { dirname, extname, join, relative, sep } from 'path';

const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const bucketArg = args.find(a => a.startsWith('--bucket='));
const restoreArg = args.find(a => a.startsWith('--restore='));

const BUCKETS = bucketArg ? [bucketArg.slice('--bucket='.length)] : ['artwork-images'];
const MAX_EDGE = 2000;
const MIN_BYTES = 700 * 1024;
const MIN_SAVING = 0.15;
const TYPES = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

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

const kb = n => `${Math.round(n / 1024)} KB`;

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

if (restoreArg) {
  const folder = restoreArg.slice('--restore='.length).replace(/^["']|["']$/g, '');
  if (!existsSync(folder)) {
    console.error(`Folder not found: ${folder}`);
    process.exit(1);
  }
  let restored = 0;
  let failed = 0;
  for (const file of walk(folder)) {
    const parts = relative(folder, file).split(sep);
    const bucket = parts[0];
    const path = parts.slice(1).join('/');
    const type = TYPES[extname(path).toLowerCase()];
    if (!bucket || !path || !type) continue;
    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, readFileSync(file), { upsert: true, contentType: type });
    if (error) {
      failed++;
      console.warn(`  could not restore ${bucket}/${path}: ${error.message}`);
    } else {
      restored++;
      console.log(`  restored ${bucket}/${path}`);
    }
  }
  console.log(`\nRestored ${restored} file(s)${failed ? `, ${failed} failed` : ''}.`);
  process.exit(failed ? 1 : 0);
}

let sharp;
try {
  sharp = (await import('sharp')).default;
} catch {
  console.error('The "sharp" image library is not installed. Run:  npm install --save-dev sharp  and try again.');
  process.exit(1);
}

if (APPLY) {
  const lines = existsSync('.gitignore')
    ? readFileSync('.gitignore', 'utf8').split(/\r?\n/).map(l => l.trim())
    : [];
  if (!lines.some(l => ['/backups', 'backups', '/backups/', 'backups/'].includes(l))) {
    console.error('Add the line  /backups  to your .gitignore first, so the saved originals can never be uploaded to GitHub.');
    process.exit(1);
  }
}

const stamp = new Date().toISOString().slice(0, 19).replace('T', '_').replace(/:/g, '-');
const originalsRoot = join('backups', `originals-${stamp}`);

async function listFiles(bucket, prefix = '') {
  const found = [];
  for (let offset = 0; ; offset += 100) {
    const { data, error } = await supabase.storage.from(bucket).list(prefix, { limit: 100, offset });
    if (error) throw error;
    if (!data || data.length === 0) break;
    for (const item of data) {
      const path = prefix ? `${prefix}/${item.name}` : item.name;
      if (item.id === null) found.push(...(await listFiles(bucket, path)));
      else found.push({ path, size: item.metadata?.size ?? null });
    }
    if (data.length < 100) break;
  }
  return found;
}

async function shrink(input, path) {
  const ext = extname(path).toLowerCase();
  let pipeline = sharp(input, { failOn: 'none' })
    .rotate()
    .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: 'inside', withoutEnlargement: true });
  if (ext === '.png') pipeline = pipeline.png({ compressionLevel: 9 });
  else if (ext === '.webp') pipeline = pipeline.webp({ quality: 85 });
  else pipeline = pipeline.jpeg({ quality: 85, mozjpeg: true });
  const { data, info } = await pipeline.toBuffer({ resolveWithObject: true });
  return { buffer: data, width: info.width, height: info.height };
}

console.log(APPLY ? 'APPLYING changes.\n' : 'DRY RUN: nothing will be changed. Add --apply to do it for real.\n');

let scanned = 0;
let changed = 0;
let failed = 0;
let beforeBytes = 0;
let afterBytes = 0;

for (const bucket of BUCKETS) {
  console.log(`Bucket: ${bucket}`);
  let files;
  try {
    files = await listFiles(bucket);
  } catch (e) {
    failed++;
    console.warn(`  could not list this bucket: ${e.message}`);
    continue;
  }

  for (const f of files) {
    const type = TYPES[extname(f.path).toLowerCase()];
    if (!type) continue;
    scanned++;
    if (f.size !== null && f.size <= MIN_BYTES) continue;

    const { data, error } = await supabase.storage.from(bucket).download(f.path);
    if (error || !data) {
      failed++;
      console.warn(`  could not download ${f.path}`);
      continue;
    }
    const input = Buffer.from(await data.arrayBuffer());

    let result;
    try {
      result = await shrink(input, f.path);
    } catch (e) {
      failed++;
      console.warn(`  could not process ${f.path}: ${e.message}`);
      continue;
    }

    const label = `${f.path}: ${kb(input.length)} -> ${kb(result.buffer.length)} (${result.width}x${result.height})`;
    if (1 - result.buffer.length / input.length < MIN_SAVING) {
      console.log(`  skip  ${label} (not worth changing)`);
      continue;
    }

    beforeBytes += input.length;
    afterBytes += result.buffer.length;

    if (!APPLY) {
      changed++;
      console.log(`  would shrink  ${label}`);
      continue;
    }

    const target = join(originalsRoot, bucket, ...f.path.split('/'));
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, input);

    const up = await supabase.storage
      .from(bucket)
      .upload(f.path, result.buffer, { upsert: true, contentType: type });
    if (up.error) {
      failed++;
      console.warn(`  FAILED  ${label}: ${up.error.message}`);
      continue;
    }
    changed++;
    console.log(`  shrunk  ${label}`);
  }
}

console.log(`\nImages looked at: ${scanned}`);
console.log(`${APPLY ? 'Shrunk' : 'Would shrink'}: ${changed}`);
if (changed > 0) {
  console.log(`Size: ${(beforeBytes / 1048576).toFixed(1)} MB -> ${(afterBytes / 1048576).toFixed(1)} MB (saves ${((beforeBytes - afterBytes) / 1048576).toFixed(1)} MB)`);
}
if (APPLY && changed > 0) {
  console.log(`\nOriginals saved in ${originalsRoot}`);
  console.log(`To undo:  node scripts/shrink-existing-images.mjs --restore=${originalsRoot}`);
}
if (!APPLY && changed > 0) console.log('\nHappy with this? Run it again with --apply.');
if (failed) console.log(`\n${failed} problem(s). Read the messages above.`);