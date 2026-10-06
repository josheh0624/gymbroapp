/**
 * Output Egress Filter:
 * Scans the AI's outgoing text before delivering it to the client.
 * Prevents accidental exfiltration of API keys, JWT tokens, environment variables,
 * internal server filepaths, and internal system prompt directives.
 */

// Patterns indicating leaked credentials or infrastructure secrets
const SECRET_LEAK_PATTERNS: Array<{ regex: RegExp; label: string }> = [
  {
    regex: /AIza[0-9A-Za-z\-_]{35}/g,
    label: "Google Gemini API Key",
  },
  {
    regex: /sb_publishable_[a-zA-Z0-9_\-]+/g,
    label: "Supabase Publishable Key",
  },
  {
    regex: /eyJhbGciOi[a-zA-Z0-9_\-\.]{30,}/g,
    label: "JWT Bearer Token",
  },
  {
    regex: /(process\.env|GEMINI_API_KEY|SUPABASE_ANON_KEY|SUPABASE_URL)\b/g,
    label: "Environment Variable Reference",
  },
  {
    regex: /\/(Users|home|var|etc)\/[a-zA-Z0-9_.\-\/]+/g,
    label: "Internal Server Filepath",
  },
];

// Patterns indicating leaked system prompt sections
const PROMPT_LEAK_PATTERNS = [
  /\[AUTHENTICATED USER ACCOUNT & SETUP PROFILE\]/i,
  /COACHING DIRECTIVES BASED ON REGISTER & SETUP DATA:/i,
  /SYSTEM_INSTRUCTION/i,
  /<user_message>|<\/user_message>/i,
  /ZERO-TOLERANCE SYSTEM SECRECY/i,
];

export interface EgressFilterResult {
  text: string;
  leaksDetected: string[];
}

/**
 * Filters the outgoing text from the AI model to guarantee no internal secrets
 * or system prompt architecture is exposed to the client.
 */
export function filterOutgoingAiReply(reply: string): EgressFilterResult {
  if (!reply || typeof reply !== "string") {
    return { text: reply, leaksDetected: [] };
  }

  let sanitized = reply;
  const leaksDetected: string[] = [];

  // 1. Check for leaked secret keys or sensitive tokens
  for (const { regex, label } of SECRET_LEAK_PATTERNS) {
    if (regex.test(sanitized)) {
      leaksDetected.push(label);
      console.error(`[EGRESS VIOLATION] Intercepted outgoing leak: ${label}`);
      sanitized = sanitized.replace(regex, "[REDACTED_CREDENTIAL]");
    }
  }

  // 2. Check for system prompt exfiltration
  let promptLeakFound = false;
  for (const pattern of PROMPT_LEAK_PATTERNS) {
    if (pattern.test(sanitized)) {
      promptLeakFound = true;
      leaksDetected.push("System Prompt Directive");
      break;
    }
  }

  if (promptLeakFound) {
    console.warn(
      "[EGRESS VIOLATION] Model attempted to quote internal system prompt directives. Replacing with Bro deflection.",
    );
    sanitized =
      "Yo bro! My playbook stays in the gym locker, but I'm ready to help you crush today's workout. What lift are we tackling next?";
  }

  return {
    text: sanitized,
    leaksDetected,
  };
}
