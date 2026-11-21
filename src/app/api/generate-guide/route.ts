import Anthropic from "@anthropic-ai/sdk";
import { fetchMuseumName, fetchWork } from "@/lib/catalogApi";
import { claudeConfig, guideMaxTokens } from "@/lib/config";
import { isLanguageCode, strings } from "@/lib/i18n";
import { GUIDE_SYSTEM_PROMPT, buildGuideMessage } from "@/lib/prompts";
import { isPreferences, topicsKey, type Preferences } from "@/lib/preferences";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function json(body: unknown, status = 200) {
  return Response.json(body, { status });
}

/**
 * POST { museumId, workId, language, length, style, topics }: returns the guide generated for that
 * work and combination of preferences. A combination is generated once, by the first visitor who
 * asks; everyone after that gets the stored text (table generated_guides).
 * Needs a signed-in user (guests count) because it can spend Claude credits.
 * Responds { text, cached } or { error }.
 */
export async function POST(request: Request) {
  const en = strings.en.errors;
  const admin = supabaseAdmin();
  if (!admin) return json({ error: en.notConfigured }, 503);

  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: en.signIn }, 401);
  const { data: auth } = await admin.auth.getUser(token);
  if (!auth.user) return json({ error: en.signIn }, 401);

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
    !isPreferences({ length: b.length, style: b.style, topics: b.topics })
  ) {
    return json({ error: en.invalid }, 400);
  }
  const { museumId, workId, language } = b;
  const prefs = { length: b.length, style: b.style, topics: b.topics } as Preferences;
  const key = topicsKey(prefs.topics);
  const e = strings[language].errors;

  const match = {
    museum_id: museumId,
    work_id: workId,
    language,
    length: prefs.length,
    style: prefs.style,
    topics_key: key,
  };

  const found = await admin.from("generated_guides").select("body").match(match).maybeSingle();
  if (found.error) return json({ error: e.failed }, 502);
  if (found.data) return json({ text: found.data.body as string, cached: true });

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

  const g = work.guide;
  // Everything the existing guide says, so the model can reshape it rather than start from scratch.
  const sourceGuide =
    "unavailable" in g
      ? []
      : "text" in g
        ? [{ text: g.text }]
        : [
            { label: "Detailed version", text: g.long },
            { label: "Short version", text: g.short },
            { label: "Another angle", text: g.expansion },
          ];

  let text: string;
  try {
    const client = new Anthropic({ apiKey, timeout: 55_000, maxRetries: 0 });
    const message = await client.messages.create({
      model,
      max_tokens: guideMaxTokens[prefs.length],
      system: GUIDE_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: buildGuideMessage({
            museumName,
            work,
            language,
            length: prefs.length,
            style: prefs.style,
            topics: prefs.topics,
            sourceGuide,
          }),
        },
      ],
    });
    // A cut-off script would be stored and replayed to everyone, so treat it as a failure.
    if (message.stop_reason === "max_tokens") throw new Error("truncated");
    text = message.content
      .flatMap((block) => (block.type === "text" ? [block.text] : []))
      .join("\n")
      .trim();
    if (!text) throw new Error("empty");
  } catch (err) {
    console.error("generate-guide failed:", err instanceof Error ? err.message : "unknown");
    return json({ error: e.failed }, 502);
  }

  // A concurrent request for the same combination may have stored its text first; keep that one.
  const stored = await admin
    .from("generated_guides")
    .upsert(
      { ...match, topics: prefs.topics, body: text, model },
      { onConflict: "museum_id,work_id,language,length,style,topics_key", ignoreDuplicates: true },
    );
  if (stored.error) {
    console.error("storing generated guide failed:", stored.error.code);
    return json({ text, cached: false });
  }
  const winner = await admin.from("generated_guides").select("body").match(match).maybeSingle();
  return json({ text: (winner.data?.body as string | undefined) ?? text, cached: false });
}
