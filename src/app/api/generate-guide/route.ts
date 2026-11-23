import Anthropic from "@anthropic-ai/sdk";
import { fetchLanguageCodes, fetchMuseumName, fetchWork } from "@/lib/catalogApi";
import { claudeConfig, guideMaxTokens } from "@/lib/config";
import { isLanguageCode, strings } from "@/lib/i18n";
import { GUIDE_SYSTEM_PROMPT, buildGuideMessage, splitGuideReply } from "@/lib/prompts";
import { isPreferences, topicsKey, type Preferences } from "@/lib/preferences";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { logUsage } from "@/lib/usageLog";

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
    !isPreferences({ language: b.language, length: b.length, style: b.style, topics: b.topics })
  ) {
    return json({ error: en.invalid }, 400);
  }
  const { museumId, workId, language } = b;
  const prefs = { language, length: b.length, style: b.style, topics: b.topics } as Preferences;
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

  const found = await admin.from("generated_guides").select("body, suggestions").match(match).maybeSingle();
  if (found.error) return json({ error: e.failed }, 502);
  if (found.data) {
    return json({ text: found.data.body as string, suggestions: (found.data.suggestions as string[] | null) ?? [], cached: true });
  }
  // A lookup only reuses a stored guide; it never spends Claude credits.
  if (b.lookupOnly === true) return json({ text: null, suggestions: [], cached: false });

  let museumName: string | undefined;
  let work;
  try {
    // Try fetching work in the user's preferred language first.
    [museumName, work] = await Promise.all([
      fetchMuseumName(museumId, language),
      fetchWork(museumId, language, workId),
    ]);
    // If not available in preferred language, try other available languages.
    if (!work) {
      const availableLangs = await fetchLanguageCodes(museumId);
      for (const lang of availableLangs) {
        if (lang !== language) {
          work = await fetchWork(museumId, lang, workId);
          if (work) break;
        }
      }
    }
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
  let suggestions: string[] = [];
  let tokens = { input: 0, output: 0 };
  try {
    const client = new Anthropic({ apiKey, timeout: 55_000, maxRetries: 0 });
    const message = await client.messages.create({
      model,
      max_tokens: guideMaxTokens[prefs.length] + 300,
      // Thinking tokens count against max_tokens and the script is a writing task, so turn thinking off
      // (this model rejects "disabled" and asks for "between_tools", which only applies once tools are used).
      thinking: { type: "between_tools" },
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
    if (message.stop_reason === "max_tokens") throw new Error("the reply hit the token limit before finishing");
    const reply = message.content
      .flatMap((block) => (block.type === "text" ? [block.text] : []))
      .join("\n")
      .trim();
    ({ script: text, suggestions } = splitGuideReply(reply));
    if (!text) throw new Error("the model returned no text");
    tokens = { input: message.usage.input_tokens, output: message.usage.output_tokens };
  } catch (err) {
    // The reason is shown to the visitor too (it holds no keys or request text) so failures can be diagnosed.
    const reason =
      err instanceof Anthropic.APIError
        ? `Claude API ${err.status ?? "error"}: ${err.message}`.slice(0, 300)
        : err instanceof Error
          ? err.message.slice(0, 300)
          : "unknown error";
    console.error("generate-guide failed:", reason);
    return json({ error: `${e.failed} (${reason})` }, 502);
  }

  await logUsage({
    kind: "guide_generation",
    user_id: auth.user.id,
    museum_id: museumId,
    work_id: workId,
    language,
    model,
    input_tokens: tokens.input,
    output_tokens: tokens.output,
  });

  // A concurrent request for the same combination may have stored its text first; keep that one.
  const stored = await admin
    .from("generated_guides")
    .upsert(
      { ...match, topics: prefs.topics, body: text, suggestions, model },
      { onConflict: "museum_id,work_id,language,length,style,topics_key", ignoreDuplicates: true },
    );
  if (stored.error) {
    console.error("storing generated guide failed:", stored.error.code);
    return json({ text, suggestions, cached: false });
  }
  const winner = await admin.from("generated_guides").select("body, suggestions").match(match).maybeSingle();
  return json({
    text: (winner.data?.body as string | undefined) ?? text,
    suggestions: (winner.data ? (winner.data.suggestions as string[] | null) : suggestions) ?? [],
    cached: false,
  });
}
