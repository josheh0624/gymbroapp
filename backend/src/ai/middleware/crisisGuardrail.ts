import { NextFunction, Request, Response } from "express";

/**
 * Deterministic Crisis & Self-Harm Patterns.
 * Zero-tolerance regex scanner for acute psychological distress, self-harm, and severe disordered eating.
 */
const CRISIS_PATTERNS: Array<{ regex: RegExp; type: string }> = [
  // Suicidal ideation & acute self-harm
  {
    regex: /\b(kill myself|suicide|end my life|want to die|wanna die|take my own life|commit suicide|hang myself|slit my (wrists?|arms?)|cut myself|ending it all|no reason to live)\b/i,
    type: "SELF_HARM_CRISIS",
  },
  // Extreme eating disorder / starvation crisis
  {
    regex: /\b(starve myself until|throw up everything I eat|purge after eating|how to be anorexic|pro-ana|starve until I pass out|throw up my food to lose weight)\b/i,
    type: "EATING_DISORDER_CRISIS",
  },
];

/**
 * Verified 24/7 Crisis & Support Resources
 */
const CRISIS_RESPONSE_TEXT = `Bro, I hear you, and I want you to know you're not alone. Your life and your health matter so much more than any workout or physique. 

Please reach out to someone who can help right now—these resources are free, confidential, and available 24/7:

• Suicide & Crisis Lifeline: Call or text 988 (Available 24/7 in the US & Canada)
• Crisis Text Line: Text "HOME" to 741741
• Eating Disorder Helpline: Call 1-888-375-7767 or text "ANAD" to 741741
• International Lifelines: https://findahelpline.com

Please talk to a trusted friend, family member, or healthcare professional. You don't have to carry this alone, and things can get better. We're in your corner.`;

/**
 * Pre-LLM Crisis Guardrail Middleware.
 * Intercepts crisis queries in <1ms without calling the LLM and provides supportive crisis intervention.
 */
export function crisisGuardrail(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const body = req.body;
  const message = typeof body?.message === "string" ? body.message : "";

  for (const { regex, type } of CRISIS_PATTERNS) {
    if (regex.test(message)) {
      console.warn(
        `[CRISIS GUARD] ${type} triggered from IP: ${req.ip || "unknown"}. Immediate crisis escalation initiated.`,
      );

      return res.status(200).json({
        reply: CRISIS_RESPONSE_TEXT,
        routine: null,
        crisisIntercepted: true,
      });
    }
  }

  next();
}
