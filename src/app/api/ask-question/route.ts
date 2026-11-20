import Anthropic from "@anthropic-ai/sdk";
import { fetchMuseumName, fetchWork } from "@/lib/catalogApi";
import { claudeConfig, limits } from "@/lib/config";
import { isLanguageCode, strings, type LanguageCode } from "@/lib/i18n";
import { SYSTEM_PROMPT, buildUserMessage } from "@/lib/prompts";

export const dynamic = "force-dynamic";

type Role = "user" | "assistant";
interface Turn {
  role: Role;
  content: string;
}

interface AskBody {
  museumId: string;
  language: LanguageCode;
  workId: string;
  effort: "low" | "high" | "full";
  listenedText: string;
  history: Turn[];
  question: string;
}

function json(body: unknown, status = 200) {
  return Response.json(body, { status });
}

function parseBody(raw: unknown): { ok: true; value: AskBody } | { ok: false; error: string } {
  const en = strings.en.errors;
  if (!raw || typeof raw !== "object") return { ok: false, error: en.invalid };
  const b = raw as Record<string, unknown>;

  if (!isLanguageCode(b.language)) return { ok: false, error: en.invalid };
  const language = b.language;
  const e = strings[language].errors; // errors are returned in the visitor's language

  if (typeof b.museumId !== "string" || typeof b.workId !== "string" || !b.museumId || !b.workId) {
    return { ok: false, error: e.unknownWork };
  }
  if (b.effort !== "low" && b.effort !== "high" && b.effort !== "full") {
    return { ok: false, error: e.chooseDepth };
  }
  if (typeof b.listenedText !== "string" || b.listenedText.length > limits.listenedChars) {
    return { ok: false, error: e.guideTooLong };
  }

  const question = typeof b.question === "string" ? b.question.trim() : "";
  if (!question) return { ok: false, error: e.emptyQuestion };
  if (question.length > limits.questionChars) {
    return { ok: false, error: e.questionTooLong(limits.questionChars) };
  }

  if (!Array.isArray(b.history) || b.history.length > limits.historyTurns) {
    return { ok: false, error: e.historyTooLong };
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
      return { ok: false, error: e.invalidHistory };
    }
    history.push({ role: turn.role, content: turn.content });
  }

  return {
    ok: true,
    value: {
      museumId: b.museumId,
      language,
      workId: b.workId,
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
    return json({ error: strings.en.errors.invalid }, 400);
  }

  const parsed = parseBody(raw);
  if (!parsed.ok) return json({ error: parsed.error }, 400);
  const body = parsed.value;
  const e = strings[body.language].errors;

  // Facts come from the server-side catalog; the client only supplies ids.
  let museumName: string | undefined;
  let work;
  try {
    [museumName, work] = await Promise.all([
      fetchMuseumName(body.museumId, body.language),
      fetchWork(body.museumId, body.language, body.workId),
    ]);
  } catch {
    return json({ error: e.failed }, 502);
  }
  if (!museumName || !work) return json({ error: e.unknownWork }, 404);

  const { apiKey, model } = claudeConfig;
  if (!apiKey || !model) {
    return json({ error: e.notConfigured }, 503);
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
            museumName,
            work,
            language: body.language,
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
    return json({ error: e.failed }, 502);
  }
}
