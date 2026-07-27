import { ConversationMessage } from "./types";

/**
 * Vercel deploys each route.ts as its own isolated serverless function —
 * /api/twilio/voice, /api/twilio/recording, and /api/tts share no memory,
 * not even across two requests from the SAME phone call. So the
 * conversation-so-far can't live in a server-side session store; it has to
 * travel WITH the request. We encode it into the `s` query param of the
 * <Record action="..."> URL Twilio calls back to, and each turn re-encodes
 * the updated state for the next one.
 */

export interface CallState {
  brandId: string;
  history: ConversationMessage[];
  turns: number;
}

// Keep the URL bounded regardless of how long a call runs — this is only a
// sliding window for what gets threaded through Twilio's callback; `turns`
// (used for the max-turns cutoff) is tracked separately and unaffected.
const MAX_HISTORY_MESSAGES = 12;

export function encodeCallState(state: CallState): string {
  const trimmed: CallState = {
    ...state,
    history: state.history.slice(-MAX_HISTORY_MESSAGES),
  };
  return Buffer.from(JSON.stringify(trimmed), "utf8").toString("base64url");
}

export function decodeCallState(encoded: string): CallState | undefined {
  try {
    const json = Buffer.from(encoded, "base64url").toString("utf8");
    const parsed = JSON.parse(json);
    if (!parsed.brandId || !Array.isArray(parsed.history)) return undefined;
    return parsed as CallState;
  } catch {
    return undefined;
  }
}
