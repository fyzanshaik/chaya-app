import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;

// console.log('Keys: ', supabaseUrl, supabaseKey);

export const supabase = createClient(supabaseUrl, supabaseKey);
