import { NextRequest, NextResponse } from "next/server";
import { getSubmission } from "@/shared/database/db.service";
import { submissionCache as costCache } from "../../cost-scan/submit/route"; // Adjust path if necessary

export async function GET(req: NextRequest) {
  try {
    const submissionId = req.nextUrl.searchParams.get("id");

    if (!submissionId) {
      return NextResponse.json(
        { error: "Missing submission ID." },
        { status: 400 }
      );
    }

    let submission = await getSubmission(submissionId);
    if (!submission) {
      // Check cache if not found in DB
      submission = costCache.get(submissionId) ?? null;
    }

    if (!submission) {
      return NextResponse.json(
        { error: "Assessment record not found or expired. Please re-run the scan." },
        { status: 404 }
      );
    }

    // Ensure the returned data is of type StoredScanResult if needed by the frontend
    // For now, return the raw submission which should match StoredScanResult structure
    return NextResponse.json(submission, { status: 200 });

  } catch (error: any) {
    console.error("[api/cost-audit/results] Unexpected error:", error);
    return NextResponse.json(
      { error: error?.message || "An unexpected server error occurred." },
      { status: 500 }
    );
  }
}
