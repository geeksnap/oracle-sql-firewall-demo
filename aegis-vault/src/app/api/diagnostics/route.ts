import { NextResponse } from "next/server";
import { getPollerStats } from "@lib/poller-stats";

export async function GET() {
  return NextResponse.json(getPollerStats());
}
