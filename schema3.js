const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://anpszskuryudqegtdsmo.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_khNqjRm8zcD27-8c4ZFWrA_-UqEMMx-";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
supabase.from('workout_log').select('*').limit(1).then(res => {
    console.log("workout_log columns:", res.data ? Object.keys(res.data[0] || {}) : [], res.error);
});
