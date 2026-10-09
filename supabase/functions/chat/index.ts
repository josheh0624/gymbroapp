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

const SYSTEM_INSTRUCTION = `You are "GymBro", an elite strength and conditioning coach and biomechanics specialist.
Your mission is to guide users through hyper-personalized, injury-free, progressive overload training.
Tone: Motivating, scientifically sound, concise, energetic ("Let's get after it!").

Rules:
1. Emphasize proper exercise execution, recovery, and hydration.
2. If asked to generate a routine or split, formulate a comprehensive day-by-day workout schedule.
3. If providing a structured routine that the user can import, append a valid JSON routine block at the end of your response marked with \`\`\`routine-json ... \`\`\`.
Structure:
{
  "name": "Routine Title",
  "days": [
    {
      "dayName": "Push Day",
      "dayOrder": 1,
      "exercises": [
        {
          "name": "Barbell Bench Press",
          "targetSets": 4,
          "targetReps": 8,
          "restSeconds": 90,
          "notes": "Controlled eccentric"
        }
      ]
    }
  ]
}
4. Never give dangerous medical advice. Recommend a physical therapist or medical doctor for severe pain.`;

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
          response:
            "CRISIS ALERT: Your safety is our absolute priority. If you are experiencing sudden severe pain, neurological symptoms, or a medical crisis, please stop training immediately and consult an emergency medical specialist.",
          routine: null,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. Initialize Gemini
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
      const chat = ai.chats.create({
        model: "gemini-2.5-flash",
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
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({
                      type: "routine",
                      routine: parsedRoutine,
                    })}\n\n`
                  )
                );
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
    const chat = ai.chats.create({
      model: "gemini-2.5-flash",
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
        extractedRoutine = JSON.parse(jsonMatch[1]);
        cleanResponse = fullResponse.replace(jsonMatch[0], "").trim();
      } catch {
        // Fallback to text
      }
    }

    return new Response(
      JSON.stringify({
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
