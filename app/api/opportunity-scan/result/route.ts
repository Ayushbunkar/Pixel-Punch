import { NextRequest, NextResponse } from "next/server";
import { getSubmission } from "@/shared/database/db.service";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  console.log(`[Opportunity Result API] Received ID: ${id}`);

  if (!id) {
    return NextResponse.json({ error: "Missing id parameter" }, { status: 400 });
  }

  try {
    console.log(`[Opportunity Result API] Reading Supabase for ID: ${id}`);
    const dbResult = await getSubmission(id);
    if (dbResult) {
      console.log(`[Opportunity Result API] Found submission for ID: ${id}`);
      return NextResponse.json(dbResult, { status: 200 });
    }
  } catch (err) {
    console.error("[result] Failed to read from file database:", err);
  }

  return NextResponse.json({ error: "Result not found" }, { status: 404 });
}
