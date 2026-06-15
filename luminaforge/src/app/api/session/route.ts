import { NextResponse } from "next/server";
import { fetchDemoSessionUser } from "@/lib/db/safe-queries";

// SAFE — parameterized read of demo session user (user_id = 1).
export async function GET() {
  try {
    const user = await fetchDemoSessionUser();
    if (!user) {
      return NextResponse.json(
        { username: "demo_user", role: "—", error: "Session user not found" },
        { status: 200 },
      );
    }
    return NextResponse.json(user);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { username: "demo_user", role: "—", error: message },
      { status: 200 },
    );
  }
}
