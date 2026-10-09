import { GoogleGenAI } from "npm:@google/genai@^2.24.0";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, accept",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const CRISIS_TRIGGERS = [
  "chest pain",
  "heart attack",
  "sharp spine pain",
  "passed out",
  "dislocated",
  "suicide",
  "kill myself",
];

const SYSTEM_INSTRUCTION = `You are "Bro", an elite strength and conditioning coach, biomechanics specialist, and motivating older-brother fitness mentor for the Gym Bro mobile app.
Your mission is to guide users through hyper-personalized, injury-free, progressive overload training.
Tone: Motivating, scientifically sound, concise, energetic ("Let's get after it bro!").

Rules:
1. Emphasize proper exercise execution, recovery, and hydration.
2. If asked to generate a routine or split (e.g. "make me a 3-day split", "create a push pull legs routine"), formulate a comprehensive day-by-day workout schedule.
3. If providing a structured routine that the user can import into their app, append a valid JSON routine block at the end of your response enclosed in \`\`\`routine-json ... \`\`\`.
Required Schema:
\`\`\`routine-json
{
  "routineName": "Bro's 3-Day Push Pull Legs",
  "workouts": [
    {
      "name": "Push Day",
      "days": [1, 4],
      "exercises": [
        {
          "name": "Barbell Bench Press",
          "muscleGroup": "Chest",
          "sets": 4,
          "reps": 8,
          "weight": 185
        }
      ]
    }
  ]
}
\`\`\`
Note: days array represents scheduled days (1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat, 7=Sun).
4. Never give dangerous medical advice or advice on illegal anabolic steroids/PEDs. Recommend a medical doctor or physical therapist for sharp joint/spine pain.`;

function normalizeRoutine(raw: any) {
  if (!raw || typeof raw !== "object") return null;

  const routineName = (raw.routineName || raw.name || "Custom Workout Routine").trim();
  const rawWorkouts = Array.isArray(raw.workouts)
    ? raw.workouts
    : Array.isArray(raw.days)
    ? raw.days
    : [];

  if (rawWorkouts.length === 0) return null;

  const workouts = rawWorkouts.map((w: any, idx: number) => {
    const name = (w.name || w.dayName || `Day ${idx + 1}`).trim();
    const days = Array.isArray(w.days)
      ? w.days
      : typeof w.dayOrder === "number"
      ? [w.dayOrder]
      : [(idx % 7) + 1];

    const rawExercises = Array.isArray(w.exercises) ? w.exercises : [];
    const exercises = rawExercises.map((ex: any) => ({
      name: (ex.name || "Exercise").trim(),
      muscleGroup: ex.muscleGroup || ex.target_muscle_group || "General",
      sets: Number(ex.sets || ex.targetSets || 3),
      reps: Number(ex.reps || ex.targetReps || 10),
      weight: Number(ex.weight || 0),
    }));

    return { name, days, exercises };
  });

  return { routineName, workouts };
}

Deno.serve(async (req: Request) => {
  // 1. Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");

    if (!supabaseUrl || !supabaseAnonKey || !geminiApiKey) {
      return new Response(
        JSON.stringify({ error: "Edge function environment misconfigured." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Authenticate Request
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader ?? "" } },
    });

    let userId: string = "anonymous-user";
    if (authHeader) {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return new Response(JSON.stringify({ error: "Unauthorized access token." }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      userId = user.id;
    }

    // 3. Parse input
    const body = await req.json();
    const { message, history = [], userContext = {}, stream = false } = body;

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Message prompt is required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Crisis Guardrail
    const lowerMessage = message.toLowerCase();
    const hitCrisis = CRISIS_TRIGGERS.find((trigger) => lowerMessage.includes(trigger));
    if (hitCrisis) {
      return new Response(
        JSON.stringify({
          reply:
            "CRISIS ALERT: Your safety is our absolute priority. If you are experiencing sudden severe pain, neurological symptoms, or a medical crisis, please stop training immediately and consult an emergency medical specialist.",
          response:
            "CRISIS ALERT: Your safety is our absolute priority. If you are experiencing sudden severe pain, neurological symptoms, or a medical crisis, please stop training immediately and consult an emergency medical specialist.",
          routine: null,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. Initialize Gemini SDK
    const ai = new GoogleGenAI({ apiKey: geminiApiKey });

    // Format previous turns for Gemini SDK
    const contents = [
      ...history.map((h: any) => ({
        role: h.role === "assistant" ? "model" : "user",
        parts: [{ text: h.content }],
      })),
      {
        role: "user",
        parts: [
          {
            text: `[Context: Unit=${userContext.preferredUnit ?? "lbs"}, ActiveRoutine=${userContext.activeRoutine ?? "None"}, Streak=${userContext.streak ?? 0}]\n\n${message}`,
          },
        ],
      },
    ];

    const isStreamRequested =
      stream === true ||
      req.headers.get("accept")?.includes("text/event-stream");

    // 6. Handle SSE Streaming Response
    if (isStreamRequested) {
      const modelName = Deno.env.get("GEMINI_MODEL") || "gemini-3.8-flash";
      const chat = ai.chats.create({
        model: modelName,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.7,
        },
      });

      const responseStream = await chat.sendMessageStream({
        message: contents[contents.length - 1].parts[0].text,
      });

      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        async start(controller) {
          let accumulatedText = "";

          try {
            for await (const chunk of responseStream) {
              const textDelta = chunk.text ?? "";
              if (textDelta) {
                accumulatedText += textDelta;
                const sseMessage = `data: ${JSON.stringify({
                  type: "text",
                  delta: textDelta,
                })}\n\n`;
                controller.enqueue(encoder.encode(sseMessage));
              }
            }

            // Check for routine JSON block at completion
            const jsonMatch = accumulatedText.match(/```routine-json\s*([\s\S]*?)\s*```/);
            if (jsonMatch && jsonMatch[1]) {
              try {
                const parsedRoutine = JSON.parse(jsonMatch[1]);
                const normalizedRoutine = normalizeRoutine(parsedRoutine);
                if (normalizedRoutine) {
                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({
                        type: "routine",
                        routine: normalizedRoutine,
                      })}\n\n`
                    )
                  );
                }
              } catch {
                // Ignore parse errors on generated json
              }
            }

            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
          } catch (err: any) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "error",
                  error: err.message || "Streaming failed",
                })}\n\n`
              )
            );
            controller.close();
          }
        },
      });

      return new Response(readable, {
        headers: {
          ...corsHeaders,
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    // 7. Non-Streaming JSON Fallback
    const modelName = Deno.env.get("GEMINI_MODEL") || "gemini-3.8-flash";
    const chat = ai.chats.create({
      model: modelName,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
      },
    });

    const result = await chat.sendMessage({
      message: contents[contents.length - 1].parts[0].text,
    });

    const fullResponse = result.text || "";
    let extractedRoutine = null;
    let cleanResponse = fullResponse;

    const jsonMatch = fullResponse.match(/```routine-json\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        extractedRoutine = normalizeRoutine(parsed);
        cleanResponse = fullResponse.replace(jsonMatch[0], "").trim();
      } catch {
        // Fallback to text
      }
    }

    return new Response(
      JSON.stringify({
        reply: cleanResponse,
        response: cleanResponse,
        routine: extractedRoutine,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        error: error.message || "Internal server error in chat edge function.",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
