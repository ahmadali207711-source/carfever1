import { createClient } from '@supabase/supabase-js';
import config from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
config.config({ path: join(rootDir, '.env.local') });
config.config({ path: join(rootDir, '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function main() {
  console.log("--- FETCHING USERS ---");
  const { data: users } = await supabase.from('users').select('id, name, email, role');
  console.log("Users:", users);

  console.log("\n--- FETCHING ALL CARS ---");
  const { data: cars, error: carsErr } = await supabase.from('cars').select('*');
  if (carsErr) console.error("Cars error:", carsErr);
  else {
    console.log(`Found ${cars?.length || 0} cars`);
    if (cars && cars.length > 0) {
      console.log("Sample car keys:", Object.keys(cars[0]));
      console.log("Sample car:", JSON.stringify(cars[0], null, 2));
    }
  }
}

main();
