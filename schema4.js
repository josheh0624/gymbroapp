const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://anpszskuryudqegtdsmo.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_khNqjRm8zcD27-8c4ZFWrA_-UqEMMx-";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
supabase.from('workout_log').insert({ workout_exercise_id: '123e4567-e89b-12d3-a456-426614174000', completed_at: new Date().toISOString() }).then(res => {
    console.log("workout_log insert error:", res.error);
});
