import { NextResponse } from "next/server";
import { fetchPolicies } from "@lib/db/queries";

export async function GET() {
  try {
    const policies = await fetchPolicies();
    return NextResponse.json({ policies });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
