/**
 * Comprehensive Sports Science, Hypertrophy Landmarks, and Biomechanics Playbook.
 * Based on peer-reviewed exercise science (Renaissance Periodization / Dr. Mike Israetel,
 * Dr. Brad Schoenfeld, Greg Nuckols, Chris Beardsley).
 */

export interface MuscleScienceData {
  primaryRole: string;
  mv: number; // Maintenance Volume (sets/week)
  mev: number; // Minimum Effective Volume (sets/week)
  mav: string; // Maximum Adaptive Volume (sets/week sweet spot)
  mrv: number; // Maximum Recoverable Volume (sets/week ceiling)
  optimalRepRanges: string;
  bestCompounds: string[];
  bestLengthenedMovements: string[];
  scientificCues: string[];
}

export const MUSCLE_SCIENCE_PLAYBOOK: Record<string, MuscleScienceData> = {
  chest: {
    primaryRole: "Horizontal adduction and shoulder flexion (clavicular head).",
    mv: 4,
    mev: 8,
    mav: "12-18",
    mrv: 22,
    optimalRepRanges:
      "Heavy compounds: 6-10 reps | Lengthened isolations: 10-15 reps",
    bestCompounds: [
      "Incline Dumbbell Press (30°)",
      "Barbell Bench Press",
      "Weighted Dips",
      "Machine Chest Press",
    ],
    bestLengthenedMovements: [
      "30° Incline Cable Fly",
      "Pec Deck (with deep stretch)",
      "Dumbbell Fly with pause",
    ],
    scientificCues: [
      "Retract and depress scapulae to create a stable shelf and spare anterior delts.",
      "Tuck elbows ~45-60° to align with pectoral muscle fibers.",
      "Pause for 1-2 seconds in the deep loaded stretch where mechanical tension is highest.",
      "Cap chest at 6-8 working sets per session; split weekly volume across 2 sessions for superior protein synthesis.",
    ],
  },
  lats: {
    primaryRole:
      "Shoulder extension and adduction in the sagittal plane (back width).",
    mv: 4,
    mev: 8,
    mav: "12-18",
    mrv: 22,
    optimalRepRanges: "8-12 reps with controlled eccentrics",
    bestCompounds: [
      "Neutral-Grip Lat Pulldown",
      "Single-Arm Neutral Cable Pulldown",
      "Pull-Ups / Chin-Ups",
      "Chest-Supported Lat Row",
    ],
    bestLengthenedMovements: [
      "Half-Kneeling Single-Arm Lat Pulldown",
      "Dumbbell Pullover",
      "Straight-Arm Cable Pushdown",
    ],
    scientificCues: [
      "Keep elbows tucked close to the ribcage during pulls to maximize lat recruitment over upper back.",
      "Allow full scapular elevation and protraction at the top for an extreme lengthened stretch.",
      "Drive with your elbows, not your hands; think of your hands as hooks.",
    ],
  },
  upperBack: {
    primaryRole:
      "Scapular retraction, elevation, and shoulder horizontal abduction (back thickness).",
    mv: 4,
    mev: 8,
    mav: "14-20",
    mrv: 24,
    optimalRepRanges: "8-15 reps",
    bestCompounds: [
      "Barbell Bent-Over Row",
      "Wide-Grip Seated Cable Row",
      "Chest-Supported T-Bar Row",
      "Meadows Row",
    ],
    bestLengthenedMovements: [
      "Kelso Shrugs on incline bench",
      "Cable Face Pulls",
      "Reverse Pec Deck",
    ],
    scientificCues: [
      "Flare elbows out to ~60-80° from the torso to emphasize rhomboids, mid-traps, and rear delts.",
      "Squeeze shoulder blades together hard at peak contraction, then fully round/protract at the bottom stretch.",
    ],
  },
  quadriceps: {
    primaryRole: "Knee extension and hip flexion (rectus femoris).",
    mv: 6,
    mev: 8,
    mav: "12-18",
    mrv: 20,
    optimalRepRanges:
      "Heavy squats: 6-10 reps | Machine compounds: 8-12 reps | Isolations: 12-18 reps",
    bestCompounds: [
      "Barbell Back Squat",
      "Hack Squat",
      "Leg Press",
      "Bulgarian Split Squat",
    ],
    bestLengthenedMovements: [
      "Heels-Elevated Goblet Squat",
      "Sissy Squat",
      "Leg Extension (seat tilted back)",
    ],
    scientificCues: [
      "Knee travel over toes is essential for deep quad tension; elevate heels with weightlifting shoes or wedges if ankle mobility is limited.",
      "Descend to parallel or below to achieve stretch-mediated hypertrophy.",
      "The rectus femoris does not get fully stimulated from squats because the hip flexes simultaneously—include Leg Extensions or Sissy Squats for complete quad development.",
    ],
  },
  hamstrings: {
    primaryRole: "Hip extension (hip hinge) and knee flexion.",
    mv: 4,
    mev: 6,
    mav: "10-16",
    mrv: 18,
    optimalRepRanges: "Hip hinges: 6-10 reps | Knee flexion: 10-15 reps",
    bestCompounds: [
      "Romanian Deadlift (RDL)",
      "Stiff-Leg Deadlift",
      "Trap Bar RDL",
    ],
    bestLengthenedMovements: [
      "Seated Leg Curl",
      "Dumbbell RDL with 2-second pause at shin level",
    ],
    scientificCues: [
      "Crucial science: Seated Leg Curls produce significantly more hypertrophy than Lying Leg Curls because the hip is flexed to 90°, placing the hamstring in a lengthened state under load.",
      "On RDLs, push hips backward until hamstrings reach end-range tension; stop before the lower back rounds.",
      "Hip hinges cause high muscle damage and take longer to recover; limit heavy RDLs to 3-4 working sets per session.",
    ],
  },
  glutes: {
    primaryRole: "Hip extension, abduction, and external rotation.",
    mv: 0, // Gets maintenance from squats/hinges
    mev: 6,
    mav: "10-16",
    mrv: 20,
    optimalRepRanges:
      "Hip Thrusts: 8-12 reps | Deep Squats/Split Squats: 8-12 reps | Abductions: 12-20 reps",
    bestCompounds: [
      "Barbell Hip Thrust",
      "Deficit Bulgarian Split Squat",
      "Deep Leg Press (high feet)",
      "Sumo Deadlift",
    ],
    bestLengthenedMovements: [
      "Walking Lunges (long stride, slight torso lean)",
      "Cable Glute Kickbacks (30° outwards)",
    ],
    scientificCues: [
      "To bias glutes over quads on lunges/split squats, take a longer stride and lean the torso forward ~30° over the front knee.",
      "Pause for a full second at peak hip extension on Hip Thrusts with posterior pelvic tilt.",
    ],
  },
  sideDelts: {
    primaryRole:
      "Shoulder abduction in the scapular plane (shoulder width/cannonball look).",
    mv: 6,
    mev: 8,
    mav: "14-22",
    mrv: 26,
    optimalRepRanges: "10-20 reps (thrive on high volume and high frequency)",
    bestCompounds: ["Overhead Press / DB Shoulder Press (secondary)"],
    bestLengthenedMovements: [
      "Cable Lateral Raise (cable set at hand/knee level for loaded stretch)",
      "Incline DB Lateral Raise",
      "Dumbbell Lateral Raise",
    ],
    scientificCues: [
      "Side delts recover rapidly and can be trained 3-4 times per week.",
      "Lead with elbows slightly forward in the scapular plane (~30° forward), not purely to the sides.",
      "Do NOT use heavy body english or trap shrugging; strict form and peak stretch create the widest delts.",
    ],
  },
  rearDelts: {
    primaryRole: "Horizontal shoulder abduction and external rotation.",
    mv: 4,
    mev: 6,
    mav: "12-18",
    mrv: 22,
    optimalRepRanges: "12-20 reps",
    bestCompounds: ["Face Pulls", "Wide Rows"],
    bestLengthenedMovements: [
      "Reverse Pec Deck",
      "Cross-Body Cable Rear Delt Fly",
      "Incline Prone DB Rear Delt Fly",
    ],
    scientificCues: [
      "Keep arms slightly bent and rotate wrists so pinkies lead slightly on cable flys.",
      "Greatly improves shoulder stability, bench strength balance, and postural alignment.",
    ],
  },
  biceps: {
    primaryRole: "Elbow flexion and forearm supination.",
    mv: 4,
    mev: 8,
    mav: "12-16",
    mrv: 20,
    optimalRepRanges: "8-15 reps",
    bestCompounds: ["Chin-Ups", "Underhand Barbell Row"],
    bestLengthenedMovements: [
      "Incline Dumbbell Curl (long head stretched behind torso)",
      "Bayesian Cable Curl",
    ],
    scientificCues: [
      "Incline DB Curls place the long head on an intense stretch behind the body—one of the best mass-builders.",
      "Include Hammer Curls to target the Brachialis (pushes the biceps peak up from beneath) and Brachioradialis.",
      "Control the eccentric for 2-3 seconds and avoid swinging the hips or front delts.",
    ],
  },
  triceps: {
    primaryRole: "Elbow extension. Long head crosses shoulder joint.",
    mv: 4,
    mev: 6,
    mav: "10-16",
    mrv: 18,
    optimalRepRanges:
      "Heavy press: 6-10 reps | Pushdowns: 10-14 reps | Overhead: 10-15 reps",
    bestCompounds: ["Close-Grip Bench Press", "Weighted Dips", "JM Press"],
    bestLengthenedMovements: [
      "Overhead Cable Tricep Extension",
      "Incline EZ-Bar Skull Crushers",
    ],
    scientificCues: [
      "The Long Head makes up the bulk of tricep mass and is ONLY placed on full stretch when the shoulder is elevated overhead (Overhead Cable Extensions).",
      "Combine an overhead extension with a heavy pressing movement and a standard cable pushdown for complete development.",
    ],
  },
  calves: {
    primaryRole: "Plantarflexion (Gastrocnemius & Soleus).",
    mv: 6,
    mev: 8,
    mav: "12-18",
    mrv: 22,
    optimalRepRanges: "10-15 reps",
    bestCompounds: ["Standing Calf Raise", "Leg Press Calf Extension"],
    bestLengthenedMovements: [
      "Standing Calf Raise with 2-3s pause in bottom stretch",
      "Seated Calf Raise (targets Soleus)",
    ],
    scientificCues: [
      "MANDATORY: Hold a dead 2-second pause in the deepest stretch position at the bottom of every rep to eliminate Achilles tendon spring recoil and force the muscle to do all the work.",
      "Standing raises hit the gastrocnemius (straight leg); seated raises hit the soleus (bent knee).",
    ],
  },
  abs: {
    primaryRole:
      "Spinal flexion, anti-extension, and intra-abdominal pressure stabilization.",
    mv: 0, // Maintained from heavy squats and deadlifts
    mev: 4,
    mav: "8-14",
    mrv: 18,
    optimalRepRanges: "10-15 reps with progressive overload",
    bestCompounds: ["Heavy Squats/Deadlifts (isometric brace)"],
    bestLengthenedMovements: [
      "Kneeling Cable Crunch",
      "Hanging Leg Raise (with pelvis posterior tilt)",
      "Ab Wheel Rollout",
    ],
    scientificCues: [
      "Train abs like any other muscle: add resistance and progressive overload rather than doing endless 50-rep bodyweight crunches.",
      "Focus on curling the pelvis toward the ribs to actively flex the spine.",
    ],
  },
};

export const SPORTS_SCIENCE_GUIDELINES = `
EXERCISE SCIENCE, VOLUME LANDMARKS & REST INTERVAL PLAYBOOK:

1. THE 4-TIER SESSION EXERCISE HIERARCHY:
   - Tier 1: Primary Neural Compound (High CNS Demand)
     * Movements: Barbell Back Squat, Deadlift, Barbell Bench Press, Standing OHP, Barbell Row.
     * Reps & Sets: 3-5 sets of 4-8 reps (or 3-5 reps for pure strength). RIR 1-2.
     * Rest: 2.5 to 4+ minutes (mandatory for complete ATP-CP resynthesis and full motor unit recruitment).
   - Tier 2: Secondary Hypertrophy Compound (Biomechanically Stable)
     * Movements: Hack Squat, Leg Press, Incline DB Press, Lat Pulldowns, Chest-Supported Rows, Romanian Deadlifts.
     * Reps & Sets: 3-4 sets of 8-12 reps. RIR 1-2.
     * Rest: 2 to 3 minutes.
   - Tier 3: Lengthened-Position Isolation (Peak Stretch Hypertrophy)
     * Movements: Seated Leg Curls, Incline DB Curls, Overhead Cable Tricep Extensions, 30° Cable Flyes, Cable Lateral Raises.
     * Reps & Sets: 3 sets of 10-15 reps. RIR 0-1.
     * Rest: 1.5 to 2 minutes.
   - Tier 4: Shortened/Pump Finisher (Metabolic Stress & Failure)
     * Movements: Pec Deck, Leg Extensions, Preacher Curls, Tricep Pushdowns, Calf Raises.
     * Reps & Sets: 2-3 sets of 12-20 reps. RIR 0 (safe failure).
     * Rest: 1 to 1.5 minutes.

2. SCIENTIFIC VOLUME LANDMARKS (Per Muscle Group):
   - Maintenance Volume (MV): ~4-6 hard sets per week. Keeps existing muscle mass while in a diet or low-training phase.
   - Minimum Effective Volume (MEV): ~8-10 hard sets per week. The minimum dose required to trigger noticeable hypertrophy.
   - Maximum Adaptive Volume (MAV): ~12-18 hard sets per week. The sweet spot where maximum muscle growth occurs.
   - Maximum Recoverable Volume (MRV): ~20-22+ hard sets per week. Beyond this, systemic fatigue outpaces recovery and causes junk volume.
   - Per-Session Rule: Limit any single muscle group to 6-8 hard working sets per session. Anything beyond 8 sets suffers severe diminishing returns and excess damage. Split weekly sets across 2-3 sessions!

3. REST INTERVAL SCIENCE:
   - Do NOT rush rest times on heavy compound lifts. Studies show resting 3 minutes yields nearly double the muscle growth and strength gains of 1-minute rest because total volume load and high-threshold motor unit recruitment remain high.
   - Compounds (Squats, Bench, Deadlift, Rows): 2.5 - 4 minutes.
   - Machine Compounds (Hack Squats, Leg Press, Lat Pulldowns): 2 - 2.5 minutes.
   - Isolations (Curls, Raises, Pushdowns): 1.5 - 2 minutes.
   - Antagonist Supersets (e.g. Biceps + Triceps or Chest + Back): Rest 60-90 seconds between exercises; allows high density without sacrificing output.

4. STRETCH-MEDIATED HYPERTROPHY & LENGTHENED PARTIALS:
   - Recent biomechanical research shows that muscles experience the greatest regional growth when tension is applied while the muscle fibers are in their elongated, stretched state.
   - Prioritize exercises that challenge the stretch: Incline DB Curls (biceps), Overhead Cable Extensions (tricep long head), Romanian Deadlifts & Seated Leg Curls (hamstrings), and Deep Hack Squats (quads).
   - Form cue: Always control the eccentric phase (2-3 seconds down) and pause for a brief 1-second count in the deep stretch before reversing direction.

5. DELOAD SCIENCE & FATIGUE MANAGEMENT:
   - When to deload: Performance drops for two consecutive sessions, morning resting heart rate is elevated, joint achiness increases, or motivation tanks.
   - Deload Protocol: Every 5-8 weeks of hard progressive overload, take 1 deload week:
     * Cut volume by 50% (e.g. 2 sets instead of 4).
     * Keep weights at ~75-80% intensity to maintain neural adaptations.
     * Keep all sets at RIR 3-4 (no sets to failure).
     * This fully dissipates accumulated fatigue and resensitizes muscles to growth!
`.trim();
