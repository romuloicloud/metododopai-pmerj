import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase credentials missing.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function clearCache() {
  const { data, error } = await supabase
    .from('lessons_cache')
    .delete()
    .neq('topic', 'force-delete');

  if (error) {
    console.error('Error clearing cache:', error);
  } else {
    console.log('Cache cleared successfully!');
  }
}

clearCache();
