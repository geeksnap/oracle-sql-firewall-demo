import { type NextRequest, NextResponse } from "next/server";

// SAFE — stub for the Lumina AI assistant.
// In production this would route through the Oracle SQLcl MCP server,
// which governs all SQL access with parameterized queries — never
// concatenating user text into SQL.
// Skipped in this first cut per demo configuration.
export async function POST(req: NextRequest) {
  const body = await req.json() as { query?: unknown };
  const question = String(body.query ?? "").trim();

  const answer = question
    ? `I understand you're asking about "${question}". The Lumina AI engine is being calibrated to your portfolio — full AI-powered insights will be available shortly.`
    : "How can I assist with your wealth management today?";

  return NextResponse.json({ answer });
}
