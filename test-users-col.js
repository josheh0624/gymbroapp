const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = "https://anpszskuryudqegtdsmo.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_khNqjRm8zcD27-8c4ZFWrA_-UqEMMx-";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
async function main() {
  const { data, error } = await supabase.from('users').select('active_routine_id').limit(1);
  console.log("error:", error);
}
main();
