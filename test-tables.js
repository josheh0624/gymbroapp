const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = "https://anpszskuryudqegtdsmo.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_khNqjRm8zcD27-8c4ZFWrA_-UqEMMx-";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
async function main() {
  const { data, error } = await supabase.rpc('get_muscle_summary', { p_user_id: '00000000-0000-0000-0000-000000000000', p_start_date: '2020-01-01', p_end_date: '2020-01-01' });
  // let's fetch all tables
}
main();
