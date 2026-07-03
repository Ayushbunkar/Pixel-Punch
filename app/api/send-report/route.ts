import { NextRequest, NextResponse } from "next/server";
import { getSubmission } from "@/shared/database/db.service";
import { submissionCache as costCache } from "../cost-scan/submit/route";
import { submissionCache as oppCache } from "../opportunity-scan/submit/route";
import { generatePdf, loadLogoBase64, getColorConfig } from "@/shared/utils/pdf-generator";
import { ReportData, ReportItem, ReportSection, renderReport } from "@/shared/utils/report-content-generator";

// ── Helper: Remove duplicate recommendations ───────────────────────────────────
function deduplicateRecommendations(recommendations: string[]): string[] {
  const seen = new Set<string>();
  return recommendations.filter((rec) => {
    const normalized = rec.toLowerCase().trim();
    if (seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
}

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";


// ─────────────────────────────────────────────────────────────────────────────
// Route handler
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { submissionId, email, scanType } = body;

    if (!submissionId || !email) {
      return NextResponse.json(
        { error: "Missing required fields: submissionId and email are required." },
        { status: 400 }
      );
    }

    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Email service is not configured (BREVO_API_KEY is missing)." },
        { status: 500 }
      );
    }

    // ── 1. Fetch submission — DB first, then both memory caches ───────────────
    let submission = await getSubmission(submissionId);
    if (!submission) {
      submission = costCache.get(submissionId) ?? oppCache.get(submissionId) ?? null;
    }

    if (!submission) {
      return NextResponse.json(
        { error: "Assessment record not found. The report may have expired — please re-submit the scan." },
        { status: 404 }
      );
    }

    // ── 2. Determine scan type and metadata ───────────────────────────────────
    const isCost = scanType === "cost" || !!submission.scorecard?.spend || !!submission.score?.spend;
    const companyName =
      submission.contact?.company ||
      submission.company?.name ||
      submission.answers?.company ||
      submission.costAnalysis?.normalizedData?.provider ||
      "your company";
    const recipientName =
      `${submission.contact?.firstname ?? ""} ${submission.contact?.lastname ?? ""}`.trim() ||
      undefined;
    const reportTitle = isCost ? "AI Cost Audit" : "AI Opportunity Audit";
    const companySize = submission.answers?.company_size || submission.company?.size || "small-to-midsize";
    const businessType = submission.answers?.business_type || submission.company?.type || "technology";

    const sections: ReportSection[] = [];
    const metadata: { [key: string]: string } = {};

    metadata['Submission ID'] = submissionId;
    if (companyName) metadata['Company'] = companyName;
    if (recipientName) metadata['Contact'] = recipientName;
    metadata['Company Size'] = companySize;
    metadata['Business Type'] = businessType;

    // Scorecard Section
    if (submission.scorecard && submission.scorecard.dimensions && submission.scorecard.dimensions.length > 0) {
      const scorecardItems: ReportItem[] = submission.scorecard.dimensions.map((dim: any) => ({
        type: 'paragraph',
        content: `<strong>${dim.label}:</strong> ${dim.labelColor} (${dim.value})`,
      }));
      sections.push({
        id: 'scorecard',
        title: 'Scorecard',
        items: scorecardItems,
      });
    }

    // Insights Section
    if (submission.insights && submission.insights.length > 0) {
      sections.push({
        id: 'insights',
        title: 'Key Insights',
        items: [{
          type: 'list',
          content: submission.insights.map((i: string) => `- ${i}`).join('\\n'),
        }],
      });
    }

    // Findings Section
    const findings: string[] =
      submission.findings
        ?.filter((f: any) => typeof f === "string")
        .slice(0, 5) || [];
    if (findings.length > 0) {
      sections.push({
        id: 'findings',
        title: `Key Findings (${findings.length})`,
        items: [{
          type: 'list',
          content: findings.map(f => `- ${f}`).join('\\n'),
        }],
      });
    }

    // Recommendations Section
    const recommendations: string[] =
      submission.recommendations
        ?.filter((r: any) => typeof r === "string")
        .slice(0, 5) || [];
    if (recommendations.length > 0) {
      sections.push({
        id: 'recommendations',
        title: `Expert Recommendations (${recommendations.length})`,
        items: [{
          type: 'list',
          content: recommendations.map(r => `- ${r}`).join('\\n'),
        }],
      });
    }

    // Audit Report Section
    if (submission.auditReport) {
      sections.push({
        id: 'auditReport',
        title: 'Full Technical Audit',
        items: [{
          type: 'paragraph',
          content: submission.auditReport,
        }],
      });
    }

    // Roadmap Section
    if (submission.roadmap) {
      const roadmapItems: ReportItem[] = [];
      if (submission.roadmap.phase1 && submission.roadmap.phase1.length > 0) {
        roadmapItems.push({
          type: 'paragraph',
          content: '<strong>Phase 1: Quick Wins (0 to 3 Months)</strong>',
        });
        roadmapItems.push({
          type: 'list',
          content: submission.roadmap.phase1.map((item: string) => `- ${item}`).join('\\n'),
        });
      }
      if (submission.roadmap.phase2 && submission.roadmap.phase2.length > 0) {
        roadmapItems.push({
          type: 'paragraph',
          content: '<strong>Phase 2: Strategic Expansion (3 to 6 Months)</strong>',
        });
        roadmapItems.push({
          type: 'list',
          content: submission.roadmap.phase2.map((item: string) => `- ${item}`).join('\\n'),
        });
      }
      if (submission.roadmap.phase3 && submission.roadmap.phase3.length > 0) {
        roadmapItems.push({
          type: 'paragraph',
          content: '<strong>Phase 3: Long-term Scale (6 to 12 Months)</strong>',
        });
        roadmapItems.push({
          type: 'list',
          content: submission.roadmap.phase3.map((item: string) => `- ${item}`).join('\\n'),
        });
      }
      if (roadmapItems.length > 0) {
        sections.push({
          id: 'roadmap',
          title: 'AI Roadmap & Phased Adoption',
          items: roadmapItems,
        });
      }
    }

    const reportData: ReportData = {
      title: reportTitle,
      timestamp: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" }),
      metadata,
      sections,
      // New fields from PdfReportData for unified model
      submissionId,
      reportType: isCost ? "cost" : "opportunity",
      scorecard: {
        dimensions: isCost
          ? [
              { label: "Spend", value: submission.scorecard?.spend || "unknown", ...getColorConfig(submission.scorecard?.spend || "unknown") },
              { label: "Architecture", value: submission.scorecard?.architecture || "unknown", ...getColorConfig(submission.scorecard?.architecture || "unknown") },
              { label: "Pain", value: submission.scorecard?.pain || "unknown", ...getColorConfig(submission.scorecard?.pain || "unknown") },
            ]
          : [
              { label: "AI Readiness", value: submission.scorecard?.readiness || "unknown", ...getColorConfig(submission.scorecard?.readiness || "unknown") },
              { label: "Business Value", value: submission.scorecard?.value || "unknown", ...getColorConfig(submission.scorecard?.value || "unknown") },
              { label: "Opportunity", value: submission.scorecard?.opportunity || "unknown", ...getColorConfig(submission.scorecard?.opportunity || "unknown") },
            ],
      },
      tier: submission.tier,
      confidenceScore: submission.confidenceScore,
      logoBase64: await loadLogoBase64(),
    };



    // ── 8. Generate PDF and Attach to Email ──────────────────────────────────────
    const pdfBuffer = await generatePdf(reportData);
    const pdfBase64 = pdfBuffer.toString("base64");
    const pdfFileName = isCost ? "audit-cost-scan.pdf" : "opportunity-audit.pdf";

    console.log(`[send-report] Generated PDF (${(pdfBuffer.length / 1024).toFixed(2)} KB) for submission ${submissionId}`);

    // ── 9. Send email with PDF attachment via Brevo ─────────────────────────────
    const response = await fetch(BREVO_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify({
        sender: { name: senderName, email: senderEmail },
        to: [{ email, name: recipientName }],
        subject: `Your ${reportTitle} Report — Pixel Punch`,
        htmlContent: renderReport(reportData, { mode: 'email' }),
        attachment: [
          {
            name: pdfFileName,
            content: pdfBase64,
          },
        ],
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("[send-report] Brevo API error:", response.status, text);

      if (response.status === 401 || response.status === 403) {
        console.warn("[send-report] Brevo auth issue — check BREVO_API_KEY and sender domain.");
        return NextResponse.json(
          { error: "Email authentication failed. Please check your Brevo API key and verified sender domain." },
          { status: 502 }
        );
      }

      return NextResponse.json(
        { error: `Failed to send email. Brevo API returned status ${response.status}.` },
        { status: 502 }
      );
    }

    console.log(`[send-report] Email sent successfully to ${email} with attachment ${pdfFileName} for submission ${submissionId}`);
    return NextResponse.json({ success: true, message: "Report email sent successfully with PDF attachment!" }, { status: 200 });

  } catch (error: any) {
    console.error("[send-report] Unexpected error:", error);
    return NextResponse.json(
      { error: error?.message || "An unexpected server error occurred." },
      { status: 500 }
    );
  }
}
