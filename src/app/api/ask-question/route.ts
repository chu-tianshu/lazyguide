import Anthropic from "@anthropic-ai/sdk";
import { getPaintingById } from "@/data/paintings";
import { claudeConfig, limits } from "@/lib/config";
import { SYSTEM_PROMPT, buildUserMessage } from "@/lib/prompts";

export const dynamic = "force-dynamic";

type Role = "user" | "assistant";
interface Turn {
  role: Role;
  content: string;
}

interface AskBody {
  paintingId: string;
  effort: "low" | "high";
  listenedText: string;
  history: Turn[];
  question: string;
}

function json(body: unknown, status = 200) {
  return Response.json(body, { status });
}

function parseBody(raw: unknown): { ok: true; value: AskBody } | { ok: false; error: string } {
  if (!raw || typeof raw !== "object") return { ok: false, error: "Invalid request." };
  const b = raw as Record<string, unknown>;

  if (typeof b.paintingId !== "string" || !b.paintingId) {
    return { ok: false, error: "Unknown work." };
  }
  if (b.effort !== "low" && b.effort !== "high") {
    return { ok: false, error: "Choose a guide depth first." };
  }
  if (typeof b.listenedText !== "string" || b.listenedText.length > limits.listenedChars) {
    return { ok: false, error: "The guide text is too long." };
  }

  const question = typeof b.question === "string" ? b.question.trim() : "";
  if (!question) return { ok: false, error: "Please type a question." };
  if (question.length > limits.questionChars) {
    return { ok: false, error: `Questions must be ${limits.questionChars} characters or fewer.` };
  }

  if (!Array.isArray(b.history) || b.history.length > limits.historyTurns) {
    return { ok: false, error: "The conversation is too long. Start a new question on another work." };
  }
  const history: Turn[] = [];
  for (const t of b.history as unknown[]) {
    const turn = t as Partial<Turn> | null;
    if (
      !turn ||
      (turn.role !== "user" && turn.role !== "assistant") ||
      typeof turn.content !== "string" ||
      turn.content.length > limits.historyTurnChars
    ) {
      return { ok: false, error: "Invalid conversation history." };
    }
    history.push({ role: turn.role, content: turn.content });
  }

  return {
    ok: true,
    value: {
      paintingId: b.paintingId,
      effort: b.effort,
      listenedText: b.listenedText,
      history,
      question,
    },
  };
}

export async function POST(request: Request) {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return json({ error: "Invalid request." }, 400);
  }

  const parsed = parseBody(raw);
  if (!parsed.ok) return json({ error: parsed.error }, 400);
  const body = parsed.value;

  const painting = getPaintingById(body.paintingId);
  if (!painting) return json({ error: "Unknown work." }, 404);

  const { apiKey, model } = claudeConfig;
  if (!apiKey || !model) {
    return json({ error: "Follow-up questions aren't set up yet on this server." }, 503);
  }

  try {
    const client = new Anthropic({
      apiKey,
      timeout: claudeConfig.timeoutMs,
      maxRetries: 1,
    });
    const message = await client.messages.create({
      model,
      max_tokens: claudeConfig.maxTokens,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: buildUserMessage({
            painting,
            effort: body.effort,
            listenedText: body.listenedText,
            history: body.history,
            question: body.question,
          }),
        },
      ],
    });

    const answer = message.content
      .flatMap((block) => (block.type === "text" ? [block.text] : []))
      .join("\n")
      .trim();
    if (!answer) throw new Error("empty answer");

    return json({ answer });
  } catch (err) {
    // Log only the error type; never the request, key, or provider body.
    console.error("ask-question failed:", err instanceof Error ? err.name : "unknown");
    return json({ error: "The guide couldn't answer right now. Please try again." }, 502);
  }
}
