import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Client } from 'pg';
import { config } from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

config({ path: join(rootDir, '.env.local') });
config({ path: join(rootDir, '.env') });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not set.');
  console.error('');
  console.error('To get your Supabase database connection string:');
  console.error('  1. Go to https://supabase.com/dashboard/project/nhlnbpylatlcdiutnsef/settings/database');
  console.error('  2. Under "Connection string", copy the URI');
  console.error('  3. Replace [YOUR-PASSWORD] with your database password');
  console.error('  4. Add to .env.local:');
  console.error('     DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.nhlnbpylatlcdiutnsef.supabase.co:5432/postgres');
  console.error('  5. Also get DB password from: Project Settings -> Database -> Password');
  process.exit(1);
}

const MIGRATIONS_DIR = join(rootDir, 'supabase', 'migrations');

const MIGRATION_ORDER = [
  '002_admin_tables.sql',
  '003_core_tables.sql',
  '004_fix_schema_alignment.sql',
  '005_add_inquiry_status.sql',
  '006_dealers_schema.sql',
  'fix_role.sql',
  'fix_remaining.sql',
  '007_fix_rls_production.sql',
];

function loadSqlFiles(): { name: string; sql: string }[] {
  const allFiles = readdirSync(MIGRATIONS_DIR);
  const sqlFiles = allFiles.filter(f => f.endsWith('.sql'));

  sqlFiles.sort((a, b) => {
    const ai = MIGRATION_ORDER.indexOf(a);
    const bi = MIGRATION_ORDER.indexOf(b);
    const orderA = ai === -1 ? 999 : ai;
    const orderB = bi === -1 ? 999 : bi;
    return orderA - orderB;
  });

  return sqlFiles.map(name => ({
    name,
    sql: readFileSync(join(MIGRATIONS_DIR, name), 'utf-8'),
  }));
}

async function main() {
  const client = new Client({ connectionString: DATABASE_URL });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    const { rows: applied } = await client.query('SELECT name FROM _migrations');
    const appliedNames = new Set(applied.map((r: { name: string }) => r.name));

    const files = loadSqlFiles();

    for (const { name, sql } of files) {
      if (appliedNames.has(name)) {
        console.log(`⏭️  Skipping ${name} (already applied)`);
        continue;
      }

      console.log(`▶️  Running ${name}...`);

      try {
        await client.query(sql);
        await client.query('INSERT INTO _migrations (name) VALUES ($1)', [name]);
        console.log(`✅ Applied ${name}`);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`❌ Failed ${name}: ${message}`);
        console.error('Migration aborted. Fix the error and re-run.');
        process.exit(1);
      }
    }

    console.log('🎉 All migrations applied successfully!');
  } finally {
    await client.end();
  }
}

main();
