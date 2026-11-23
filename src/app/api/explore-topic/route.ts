import Anthropic from "@anthropic-ai/sdk";
import { fetchMuseumName, fetchWork } from "@/lib/catalogApi";
import { claudeConfig, limits } from "@/lib/config";
import { isLanguageCode, strings } from "@/lib/i18n";
import { EXPLORE_SYSTEM_PROMPT, buildExploreMessage } from "@/lib/prompts";
import { logUsage } from "@/lib/usageLog";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function json(body: unknown, status = 200) {
  return Response.json(body, { status });
}

/**
 * POST { museumId, workId, language, topic, covered }: writes a short extra guide segment about one
 * suggested angle, avoiding what the visitor has already heard (`covered`). Responds { text } or { error }.
 */
export async function POST(request: Request) {
  const en = strings.en.errors;
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return json({ error: en.invalid }, 400);
  }
  const b = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  if (
    typeof b.museumId !== "string" ||
    typeof b.workId !== "string" ||
    !b.museumId ||
    !b.workId ||
    !isLanguageCode(b.language) ||
    typeof b.topic !== "string" ||
    !b.topic.trim() ||
    b.topic.length > 80 ||
    typeof b.covered !== "string" ||
    b.covered.length > limits.listenedChars * 2
  ) {
    return json({ error: en.invalid }, 400);
  }
  const { museumId, workId, language, topic, covered } = b as {
    museumId: string;
    workId: string;
    language: "en" | "zh";
    topic: string;
    covered: string;
  };
  const e = strings[language].errors;

  let museumName: string | undefined;
  let work;
  try {
    [museumName, work] = await Promise.all([
      fetchMuseumName(museumId, language),
      fetchWork(museumId, language, workId),
    ]);
  } catch {
    return json({ error: e.failed }, 502);
  }
  if (!museumName || !work) return json({ error: e.unknownWork }, 404);

  const { apiKey, model } = claudeConfig;
  if (!apiKey || !model) return json({ error: e.notConfigured }, 503);

  try {
    const client = new Anthropic({ apiKey, timeout: 55_000, maxRetries: 0 });
    const message = await client.messages.create({
      model,
      max_tokens: 2000,
      thinking: { type: "between_tools" },
      system: EXPLORE_SYSTEM_PROMPT,
      messages: [
        { role: "user", content: buildExploreMessage({ museumName, work, language, topic: topic.trim(), covered }) },
      ],
    });
    if (message.stop_reason === "max_tokens") throw new Error("token limit");
    const text = message.content
      .flatMap((block) => (block.type === "text" ? [block.text] : []))
      .join("\n")
      .trim();
    if (!text) throw new Error("empty");
    await logUsage({
      kind: "question",
      museum_id: museumId,
      work_id: workId,
      language,
      model,
      input_tokens: message.usage.input_tokens,
      output_tokens: message.usage.output_tokens,
    });
    return json({ text });
  } catch (err) {
    console.error("explore-topic failed:", err instanceof Error ? err.name : "unknown");
    return json({ error: e.failed }, 502);
  }
}
