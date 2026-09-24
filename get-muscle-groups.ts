import { createClient } from '@supabase/supabase-js';
const supabase = createClient("https://anpszskuryudqegtdsmo.supabase.co", "sb_publishable_khNqjRm8zcD27-8c4ZFWrA_-UqEMMx-");

async function main() {
  const { data, error } = await supabase.from('muscle_groups').select('*');
  if (error) console.error(error);
  else console.log(JSON.stringify(data, null, 2));
}
main();
