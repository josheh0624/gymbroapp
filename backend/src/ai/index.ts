import {
  GoogleGenAI,
  HarmBlockThreshold,
  HarmCategory,
  Type,
} from "@google/genai";
import cors from "cors";
import dotenv from "dotenv";
import express, { Request, Response } from "express";
import { authenticateAiRequest } from "./middleware/auth";
import { crisisGuardrail } from "./middleware/crisisGuardrail";
import { dailyQuotaLimiter } from "./middleware/quotaManager";
import { chatRateLimiter } from "./middleware/rateLimiter";
import { securityFirewall } from "./middleware/securityFirewall";
import { SYSTEM_INSTRUCTION } from "./prompts/persona";
import { filterOutgoingAiReply } from "./utils/egressFilter";
import { getVerifiedUserContext } from "./utils/profileBinder";
import {
  validateAndSanitizeChatInput,
  validateAndSanitizeRoutine,
} from "./utils/sanitizer";
import { logSecurityEvent } from "./utils/securityAuditLogger";

dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const app = express();
const PORT = 3000;

// Tool declaration for creating a structured workout routine
const createWorkoutRoutineTool = {
  name: "createWorkoutRoutine",
  description:
    "Generate and create a structured workout routine for the user with days and exercises.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      routineName: {
        type: Type.STRING,
        description:
          "Catchy name for the routine, e.g. 'Bro's 3-Day Push Pull Legs', 'Full Body Strength'",
      },
      workouts: {
        type: Type.ARRAY,
        description: "List of individual workout days in the routine",
        items: {
          type: Type.OBJECT,
          properties: {
            name: {
              type: Type.STRING,
              description:
                "Name of the workout day, e.g. 'Push Day', 'Pull Day', 'Leg Day', 'Upper Body'",
            },
            days: {
              type: Type.ARRAY,
              items: { type: Type.INTEGER },
              description:
                "Scheduled days of the week: 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat, 7=Sun",
            },
            exercises: {
              type: Type.ARRAY,
              description: "List of exercises for this workout",
              items: {
                type: Type.OBJECT,
                properties: {
                  name: {
                    type: Type.STRING,
                    description:
                      "Standard exercise name (e.g. 'Barbell Bench Press', 'Incline Dumbbell Press', 'Barbell Squat', 'Lat Pulldown (Wide Grip)')",
                  },
                  muscleGroup: {
                    type: Type.STRING,
                    description:
                      "Target muscle group (e.g. 'Chest', 'Back', 'Quadriceps', 'Hamstrings', 'Shoulders', 'Biceps', 'Triceps', 'Abs')",
                  },
                  sets: {
                    type: Type.INTEGER,
                    description:
                      "Number of working sets (typically 3-4 per exercise, adhering to the 6-8 sets per muscle group per session cap)",
                  },
                  reps: {
                    type: Type.INTEGER,
                    description:
                      "Target reps per set adhering to the 4-tier hierarchy (4-8 for primary compounds, 8-12 for secondary compounds, 10-15 for isolations)",
                  },
                  weight: {
                    type: Type.NUMBER,
                    description:
                      "Suggested starting weight in lbs (0 for bodyweight/unspecified)",
                  },
                },
                required: ["name", "sets", "reps"],
              },
            },
          },
          required: ["name", "days", "exercises"],
        },
      },
    },
    required: ["routineName", "workouts"],
  },
};

// Hardware-level Gemini Safety Settings
const geminiSafetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
  },
];

//middleware to parse json
app.use(cors());
app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.json({ message: "hello from ai backend" });
});

app.post(
  "/chat",
  chatRateLimiter,
  authenticateAiRequest,
  dailyQuotaLimiter,
  crisisGuardrail,
  securityFirewall,
  async (req: Request, res: Response) => {
    try {
      // 1. Validate and sanitize incoming request payload
      const validation = validateAndSanitizeChatInput(req.body);
      if (!validation.valid || !validation.data) {
        return res.status(400).json({
          error: validation.error || "Invalid request payload.",
        });
      }

      const { message, history, userContext } = validation.data;

      // 2. Server-Side Identity Binding: cross-check with Supabase DB & auth metadata
      const authenticatedUser = (req as any).user;
      const verifiedContext = await getVerifiedUserContext(
        authenticatedUser?.id || "dev-user",
        authenticatedUser?.user_metadata,
        userContext,
      );

      // Build personalized system instruction using verified profile context
      let personalizedInstruction = SYSTEM_INSTRUCTION;
      if (verifiedContext) {
        const contextLines: string[] = [];

        if (verifiedContext.username) {
          contextLines.push(`- User Name: ${verifiedContext.username}`);
        }
        if (verifiedContext.email) {
          contextLines.push(`- Account Email: ${verifiedContext.email}`);
        }
        if (verifiedContext.age) {
          contextLines.push(
            `- Age: ${verifiedContext.age} years old${verifiedContext.birthday ? ` (Birthday: ${verifiedContext.birthday})` : ""}`,
          );
        } else if (verifiedContext.birthday) {
          contextLines.push(`- Birthday: ${verifiedContext.birthday}`);
        }
        if (verifiedContext.sex) {
          contextLines.push(`- Gender / Sex: ${verifiedContext.sex}`);
        }

        const unit = verifiedContext.preferredUnit || "lbs";
        if (verifiedContext.weightLbs) {
          const weightInKg = (verifiedContext.weightLbs * 0.453592).toFixed(1);
          if (unit === "kgs") {
            contextLines.push(
              `- Bodyweight: ${weightInKg} kg (${verifiedContext.weightLbs} lbs) [User preferred unit: KGS]`,
            );
          } else {
            contextLines.push(
              `- Bodyweight: ${verifiedContext.weightLbs} lbs (${weightInKg} kg) [User preferred unit: LBS]`,
            );
          }
        }

        if (verifiedContext.heightFormatted) {
          contextLines.push(`- Height: ${verifiedContext.heightFormatted}`);
        } else if (verifiedContext.heightFt) {
          const totalInches = Math.round(verifiedContext.heightFt * 12);
          const ft = Math.floor(totalInches / 12);
          const inches = totalInches % 12;
          const cm = Math.round(verifiedContext.heightFt * 30.48);
          contextLines.push(`- Height: ${ft}'${inches}" (${cm} cm)`);
        }

        if (verifiedContext.experienceLevel) {
          contextLines.push(`- Experience Level: ${verifiedContext.experienceLevel}`);
        }
        if (verifiedContext.primaryGoals) {
          const goalsStr = Array.isArray(verifiedContext.primaryGoals)
            ? verifiedContext.primaryGoals.join(", ")
            : verifiedContext.primaryGoals;
          contextLines.push(`- Primary Fitness Goals: ${goalsStr}`);
        }

        const prDetails: string[] = [];
        if (verifiedContext.benchPR)
          prDetails.push(`Bench Press: ${verifiedContext.benchPR} lbs`);
        if (verifiedContext.squatPR)
          prDetails.push(`Squat: ${verifiedContext.squatPR} lbs`);
        if (verifiedContext.deadliftPR)
          prDetails.push(`Deadlift: ${verifiedContext.deadliftPR} lbs`);
        contextLines.push(
          `- Personal Records (PRs): ${prDetails.length > 0 ? prDetails.join(", ") : "None recorded yet"}`,
        );

        if (verifiedContext.activeRoutine) {
          contextLines.push(
            `- Active Workout Routine: ${verifiedContext.activeRoutine}`,
          );
        }
        if (verifiedContext.streak !== undefined && verifiedContext.streak !== null) {
          contextLines.push(`- Workout Streak: ${verifiedContext.streak} days`);
        }
        if (
          verifiedContext.workedOutToday !== undefined &&
          verifiedContext.workedOutToday !== null
        ) {
          contextLines.push(
            `- Worked Out Today: ${verifiedContext.workedOutToday ? "Yes" : "Not yet"}`,
          );
        }

        if (contextLines.length > 0) {
          const goalsList = Array.isArray(verifiedContext.primaryGoals)
            ? verifiedContext.primaryGoals.join(", ")
            : verifiedContext.primaryGoals || "general fitness";

          personalizedInstruction +=
            `\n\n[AUTHENTICATED USER ACCOUNT & SETUP PROFILE]\n` +
            contextLines.join("\n") +
            `\n\nCOACHING DIRECTIVES BASED ON REGISTER & SETUP DATA:\n` +
            `1. FACTOR EXPERIENCE LEVEL (${verifiedContext.experienceLevel || "general"}): Adjust explanations and exercise complexity accordingly. If beginner, break down jargon and prioritize form/motor patterns. If intermediate/advanced, use high gym-IQ and double progression.\n` +
            `2. FACTOR PRIMARY GOALS (${goalsList}): Align workout recommendations, rep schemes (e.g. 8-12 for muscle building vs 3-6 for strength), volume, and nutrition advice directly with their goals.\n` +
            `3. FACTOR BIOMECHANICS & STATS: Account for height (leverages in squats/pressing), bodyweight, age (recovery capacity/warmup needs), and sex. Always express weights in the user's preferred unit (${unit})!\n` +
            `4. FACTOR PRs: When generating workouts or calculating loads, compute working weights directly from their actual PRs (~70-80% 1RM).\n` +
            `5. ACCOUNTABILITY & MOTIVATION: Greet them naturally by name (${verifiedContext.username || "Lifter"}), celebrate their streak, and keep them hyped!`;
        }
      }

      // 3. Format history safely for Gemini
      const formattedHistory = history.map(
        (msg: { role: string; content: string }) => ({
          role: msg.role === "assistant" ? "model" : "user",
          parts: [{ text: msg.content }],
        }),
      );

      const modelName = process.env.GEMINI_MODEL_NAME || "gemini-3.5-flash-lite";

      // 4. Wrap user prompt in boundary tags to isolate from system instructions
      const userPrompt = `<user_message>\n${message}\n</user_message>`;

      // 5. Create chat session with Bro and tools
      let response;
      try {
        const chat = ai.chats.create({
          model: modelName,
          config: {
            systemInstruction: personalizedInstruction,
            temperature: 0.7,
            tools: [{ functionDeclarations: [createWorkoutRoutineTool] }],
            safetySettings: geminiSafetySettings,
          },
          history: formattedHistory,
        });

        // Send message and get reply from AI
        response = await chat.sendMessage({ message: userPrompt });
      } catch (modelErr: any) {
        if (modelName !== "gemini-3.5-flash-lite") {
          console.warn(
            `Model ${modelName} unavailable (${modelErr.message}), falling back to gemini-3.5-flash-lite...`,
          );
          const fallbackChat = ai.chats.create({
            model: "gemini-3.5-flash-lite",
            config: {
              systemInstruction: personalizedInstruction,
              temperature: 0.7,
              tools: [{ functionDeclarations: [createWorkoutRoutineTool] }],
              safetySettings: geminiSafetySettings,
            },
            history: formattedHistory,
          });
          response = await fallbackChat.sendMessage({ message: userPrompt });
        } else {
          throw modelErr;
        }
      }

      // Check if response was blocked by safety settings
      if (response.candidates?.[0]?.finishReason === "SAFETY") {
        logSecurityEvent({
          eventType: "SAFETY_FILTER_TRIGGERED",
          userId: authenticatedUser?.id,
          ip: req.ip,
          details: { finishReason: "SAFETY" },
        });

        return res.json({
          reply:
            "Yo bro, safety first! I can't generate a response for that because it tripped safety guardrails. Keep it clean and gym-focused!",
          routine: null,
        });
      }

      // 6. Extract and sanitize routine if generated (with 1RM & dangerous movement guardrails)
      let routine = null;
      if (response.functionCalls && response.functionCalls.length > 0) {
        const routineCall = response.functionCalls.find(
          (call) => call.name === "createWorkoutRoutine",
        );
        if (routineCall && routineCall.args) {
          routine = validateAndSanitizeRoutine(
            routineCall.args,
            verifiedContext,
          );
        }
      }

      const rawReply =
        response.text ||
        (routine
          ? "Yo bro! I cooked up a custom workout routine for you. Check out the breakdown below and tap 'Save Routine to App' to add it directly to your workouts!"
          : "I'm on it bro, but hit a slight snag generating the reply. Try asking again!");

      // 7. Output Egress Filter: Scan outgoing text for credential or prompt leakage
      const egressCheck = filterOutgoingAiReply(rawReply);
      const reply = egressCheck.text;

      if (egressCheck.leaksDetected.length > 0) {
        logSecurityEvent({
          eventType: "EGRESS_SECRET_BLOCKED",
          userId: authenticatedUser?.id,
          ip: req.ip,
          details: { leaks: egressCheck.leaksDetected },
        });
      }

      res.json({
        reply,
        routine,
      });
    } catch (error: any) {
      console.error("AI Chat Error:", error);
      // Avoid leaking internal stack traces or API keys to the client
      res.status(500).json({
        error: "Failed to generate reply from Bro. Please try asking again!",
      });
    }
  },
);

app.listen(PORT, "0.0.0.0", () => {
  console.log("ai server running on" + PORT);
});
