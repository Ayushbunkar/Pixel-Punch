import { NextRequest, NextResponse } from "next/server";
import { submissionCache } from "../submit/route";
import { getSubmission } from "@/shared/database/db.service";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing id parameter" }, { status: 400 });
  }

  // 1. Try memory cache first (fastest, always works on Vercel)
  const cached = submissionCache.get(id);
  if (cached) {
    return NextResponse.json(cached, { status: 200 });
  }

  // 2. Fallback to file-based database (works locally, not on Vercel serverless)
  try {
    const dbResult = await getSubmission(id);
    if (dbResult) {
      return NextResponse.json(dbResult, { status: 200 });
    }
  } catch (err) {
    console.error("[result] Failed to read from file database:", err);
  }

  return NextResponse.json({ error: "Result not found" }, { status: 404 });
}
