import { createClient } from '@supabase/supabase-js';
import { existsSync, readFileSync } from 'fs';

const APPLY = process.argv.includes('--apply');

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

let sharp;
try {
  sharp = (await import('sharp')).default;
} catch {
  console.error('The "sharp" image library is not installed. Run:  npm install --save-dev sharp  and try again.');
  process.exit(1);
}

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

console.log(APPLY ? 'APPLYING changes.\n' : 'DRY RUN: nothing will be changed. Add --apply to do it for real.\n');

const { data: rows, error } = await supabase
  .from('artworks')
  .select('id, title, image_url')
  .is('image_width', null)
  .not('image_url', 'is', null)
  .limit(1000);

if (error) {
  console.error('Could not read the artworks. Has the SQL been run?', error.message);
  process.exit(1);
}

let done = 0;
let failed = 0;

for (const row of rows) {
  try {
    const res = await fetch(row.image_url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buffer = Buffer.from(await res.arrayBuffer());
    const meta = await sharp(buffer, { failOn: 'none' }).metadata();
    let width = meta.width;
    let height = meta.height;
    if (meta.orientation && meta.orientation >= 5) [width, height] = [height, width];
    if (!width || !height) throw new Error('could not read the size');

    console.log(`  ${APPLY ? 'set' : 'would set'}  ${row.title}: ${width} x ${height}`);
    if (APPLY) {
      const { error: updateError } = await supabase
        .from('artworks')
        .update({ image_width: width, image_height: height })
        .eq('id', row.id);
      if (updateError) throw updateError;
    }
    done++;
  } catch (e) {
    failed++;
    console.warn(`  could not read ${row.title}: ${e.message}`);
  }
}

console.log(`\nPieces without a size: ${rows.length}`);
console.log(`${APPLY ? 'Updated' : 'Would update'}: ${done}`);
if (failed) console.log(`${failed} problem(s). Read the messages above.`);
if (!APPLY && done > 0) console.log('\nHappy with this? Run it again with --apply.');