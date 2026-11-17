export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({
    ok: true,
    anthropicConfigured: Boolean(process.env.ANTHROPIC_API_KEY),
  });
}
