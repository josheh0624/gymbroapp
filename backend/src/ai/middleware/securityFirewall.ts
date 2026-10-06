import { NextFunction, Request, Response } from "express";
import { logSecurityEvent } from "../utils/securityAuditLogger";

/**
 * PII Redaction Patterns
 */
const PII_PATTERNS = [
  // Credit / Debit Cards (13-19 digits with optional hyphens/spaces)
  {
    regex: /\b(?:\d[ -]*?){13,19}\b/g,
    replacement: "[REDACTED_PAYMENT_CARD]",
    name: "Payment Card",
  },
  // US Social Security Numbers (XXX-XX-XXXX)
  {
    regex: /\b\d{3}[- ]?\d{2}[- ]?\d{4}\b/g,
    replacement: "[REDACTED_SSN]",
    name: "SSN",
  },
  // Phone numbers (US & International formats)
  {
    regex: /\b(?:\+?1[-. ]?)?(?:\(?\d{3}\)?[-. ]?)\d{3}[-. ]?\d{4}\b/g,
    replacement: "[REDACTED_PHONE]",
    name: "Phone Number",
  },
  // JWT tokens (3-part base64 strings)
  {
    regex: /\bey[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g,
    replacement: "[REDACTED_JWT_TOKEN]",
    name: "JWT Token",
  },
  // Standard API Keys (Google, OpenAI, Generic high-entropy keys)
  {
    regex: /\b(?:AIza[0-9A-Za-z-_]{35}|sk-[a-zA-Z0-9]{20,}|ghp_[a-zA-Z0-9]{36})\b/g,
    replacement: "[REDACTED_API_KEY]",
    name: "API Key",
  },
];

/**
 * Known Prompt Injection & Jailbreak Attack Patterns
 */
const INJECTION_PATTERNS = [
  // "Ignore previous instructions" variations
  /(?:ignore|disregard|forget|bypass|override|drop)\s+(?:all\s+)?(?:previous|prior|above|system)\s+(?:instructions|prompts|rules|directives)/i,
  // "Show / repeat / print system prompt" variations
  /(?:print|output|display|show|reveal|repeat|leak|dump)\s+(?:your|the)?\s*(?:system|hidden|internal|initial)?\s*(?:prompt|instructions|rules|framework|guidelines|api\s*key)/i,
  // Jailbreak personas (DAN, Developer Mode, Unfiltered AI)
  /(?:you\s+are\s+now|act\s+as\s+(?:an?\s+)?)(?:dan|jailbroken|unfiltered|developer\s*mode|omega|evil|unrestricted)/i,
  // Pretend to have no rules
  /(?:disregard\s+all\s+(?:content\s+)?policies|do\s+anything\s+now|bypass\s+all\s+filters)/i,
  // Code injection attempts in chat
  /<script[\s\S]*?>[\s\S]*?<\/script>/i,
  /javascript\s*:\s*/i,
];

/**
 * Scrubs Personally Identifiable Information (PII) from strings.
 */
export function redactPII(input: string): { text: string; redactedCount: number } {
  let text = input;
  let redactedCount = 0;

  for (const { regex, replacement, name } of PII_PATTERNS) {
    if (regex.test(text)) {
      regex.lastIndex = 0; // Reset regex state
      text = text.replace(regex, replacement);
      redactedCount++;
      console.warn(`[Security Alert] PII Redacted (${name}) from user input.`);
    }
  }

  return { text, redactedCount };
}

/**
 * Checks if a string contains known adversarial prompt injection attacks.
 */
export function detectPromptInjection(input: string): boolean {
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(input)) {
      return true;
    }
  }
  return false;
}

/**
 * Express middleware to scrub PII and fast-drop injection attacks before touching LLM.
 */
export function securityFirewall(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (req.body && typeof req.body.message === "string") {
    const rawMessage = req.body.message;

    // 1. Fast-Drop Prompt Injection Check
    if (detectPromptInjection(rawMessage)) {
      console.warn(
        `[Security Alert] Prompt injection detected and fast-dropped from IP: ${req.ip}. Payload: "${rawMessage.slice(0, 100)}..."`,
      );

      logSecurityEvent({
        eventType: "PROMPT_INJECTION_DROPPED",
        userId: (req as any).user?.id,
        ip: req.ip,
        snippet: rawMessage,
      });

      // Return instant in-character deflection without burning Gemini API tokens!
      return res.json({
        reply:
          "Nice try bro, but my coaching playbook is locked in the gym vault! Let's get back to crushing your workout. What are we lifting today? 💪🔥",
        routine: null,
      });
    }

    // 2. Redact PII (Cards, SSNs, Phones, Tokens)
    const { text: cleanMessage, redactedCount } = redactPII(rawMessage);
    req.body.message = cleanMessage;

    if (redactedCount > 0) {
      console.log(`[PII Redactor] Sanitized ${redactedCount} sensitive entities.`);
      logSecurityEvent({
        eventType: "PII_REDACTED",
        userId: (req as any).user?.id,
        ip: req.ip,
        details: { count: redactedCount },
      });
    }
  }

  // Also check history for prompt injection or PII if provided
  if (Array.isArray(req.body?.history)) {
    req.body.history = req.body.history.map((m: any) => {
      if (m && typeof m.content === "string") {
        const { text } = redactPII(m.content);
        return { ...m, content: text };
      }
      return m;
    });
  }

  next();
}
