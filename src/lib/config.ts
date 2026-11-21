/**
 * Server-side configuration for Claude calls. Read only in server code.
 * Set ANTHROPIC_API_KEY and ANTHROPIC_MODEL in Vercel (or .env.local locally).
 */
export const claudeConfig = {
  get apiKey(): string | undefined {
    return process.env.ANTHROPIC_API_KEY || undefined;
  },
  get model(): string | undefined {
    return process.env.ANTHROPIC_MODEL || undefined;
  },
  maxTokens: Number(process.env.ANTHROPIC_MAX_TOKENS) || 800,
  timeoutMs: 30_000,
};

/** Request size limits (correctness guards, not a usage quota). */
export const limits = {
  questionChars: 500,
  listenedChars: 20_000,
  historyTurns: 6,
  historyTurnChars: 2_000,
};

/** Output budget for a generated guide, by requested length (Chinese needs more tokens per word). */
export const guideMaxTokens = { short: 700, medium: 1400, long: 2600 } as const;
