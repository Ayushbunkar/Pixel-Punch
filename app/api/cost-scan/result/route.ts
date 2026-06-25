import { NextRequest, NextResponse } from "next/server";
import { submissionCache }           from "../submit/route";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing id parameter" }, { status: 400 });
  }

  // Look up in the in-memory cache
  const result = submissionCache.get(id);

  if (!result) {
    return NextResponse.json({ error: "Result not found" }, { status: 404 });
  }

  return NextResponse.json(result, { status: 200 });
}
