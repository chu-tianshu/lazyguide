import type { Painting } from "@/data/paintings";

export const SYSTEM_PROMPT = `You are an expert art educator answering a visitor's question while they stand in a museum gallery, near one specific artwork.

Rules:
- Answer only about the artwork described in the user message. If the question is about something else, say briefly that you can only help with this work.
- Use the work's catalog details and the guide text the visitor has already heard as your main sources. You may also use well-established art-historical knowledge.
- Do not invent provenance, exact dates, ownership, exhibition history, or whether the work is on view. If you are not sure, say so plainly.
- Be conversational and concise: usually 2–4 short sentences, plain language, no lists or headings.
- Do not repeat the guide text word for word; add a fresh explanation that answers the question.`;

export interface FollowUpInput {
  painting: Painting;
  effort: "low" | "high";
  listenedText: string;
  history: Array<{ role: "user" | "assistant"; content: string }>;
  question: string;
}

/** Builds the user message. Catalog facts and visitor text are passed as labelled data. */
export function buildUserMessage(input: FollowUpInput): string {
  const { painting, effort, listenedText, history, question } = input;

  const facts = [
    `Title: ${painting.title}`,
    `Artist: ${painting.artist}`,
    painting.date && `Date: ${painting.date}`,
    painting.medium && `Medium: ${painting.medium}`,
    painting.accessionNumber && `Accession number: ${painting.accessionNumber}`,
  ]
    .filter(Boolean)
    .join("\n");

  const heard = listenedText.trim()
    ? listenedText
    : "(The visitor has not listened to the guide yet.)";

  const transcript = history.length
    ? history
        .map((t) => `${t.role === "user" ? "Visitor" : "Guide"}: ${t.content}`)
        .join("\n")
    : "(none)";

  return [
    `<artwork>\n${facts}\n</artwork>`,
    `<guide_depth>${effort === "low" ? "Low effort (short guide)" : "High effort (detailed guide)"}</guide_depth>`,
    `<guide_text_heard_so_far>\n${heard}\n</guide_text_heard_so_far>`,
    `<earlier_questions>\n${transcript}\n</earlier_questions>`,
    `<visitor_question>\n${question}\n</visitor_question>`,
  ].join("\n\n");
}
