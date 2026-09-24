const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://anpszskuryudqegtdsmo.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_khNqjRm8zcD27-8c4ZFWrA_-UqEMMx-";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
supabase.from('workout_exercises').insert({ exercise_id: 1, sets: 3, reps: 10 }).select().then(res => {
    console.log("insert without workout_id:", res.error);
});
