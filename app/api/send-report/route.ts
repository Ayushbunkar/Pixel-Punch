import { NextRequest, NextResponse } from "next/server";
import { getSubmission } from "@/shared/database/db.service";
import { generatePdf, loadLogoBase64 } from "@/shared/utils/pdf-generator";
import { ReportData, renderReportToHtml, getColorConfig } from "@/shared/utils/report-content-generator"; // Added renderReportToHtml and getColorConfig

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

function mapScoreToRAGStatus(score: string | number | undefined): "red" | "amber" | "green" | "unknown" {
  if (typeof score === 'number') {
    if (score <= 2) return "red";
    if (score === 3) return "amber";
    if (score >= 4) return "green";
  }
  if (typeof score === 'string') {
    const lowerCaseScore = score.toLowerCase();
    if (lowerCaseScore === "red" || lowerCaseScore === "amber" || lowerCaseScore === "green") {
      return lowerCaseScore;
    }
    const parsed = parseInt(lowerCaseScore, 10);
    if (!isNaN(parsed)) {
      if (parsed <= 2) return "red";
      if (parsed === 3) return "amber";
      if (parsed >= 4) return "green";
    }
  }
  return "unknown";
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
      return NextResponse.json(
        { error: "Assessment record not found. The report may have expired — please re-submit the scan." },
        { status: 404 }
      );
    }

    // ── 2. Determine scan type and metadata ───────────────────────────────────
    const isCost = scanType === "cost" || !!submission.scorecard?.spend || !!submission.score?.spend;
    const companyName =
      submission.company?.name ||
      submission.contact?.company ||
      submission.answers?.company ||
      submission.answers?.company_name ||
      submission.costAnalysis?.normalizedData?.provider ||
      (submission.contact?.firstname ? undefined : undefined) ||
      "N/A";
    const recipientName =
      `${submission.contact?.firstname ?? ""} ${submission.contact?.lastname ?? ""}`.trim() ||
      undefined;
    const reportTitle = isCost ? "AI Cost Audit" : "AI Opportunity Audit";
    const companySize = submission.answers?.company_size || submission.company?.size || "small-to-midsize";
    const businessType = submission.answers?.business_type || submission.company?.type || "technology";

    // sections and metadata preparation remains the same, as it forms the base for ReportData
    const sections: any[] = []; // Changed to any[] to avoid strict typing issues here
    const metadata: { [key: string]: string } = {};

    metadata['Submission ID'] = submissionId;
    if (companyName) metadata['Company'] = companyName;
    if (recipientName) metadata['Contact'] = recipientName;
    metadata['Company Size'] = companySize;
    metadata['Business Type'] = businessType;

    // Scorecard Section
    // The scorecard data is now directly part of ReportData
    // No need to create separate scorecardItems here if they are only used for the ReportData object below

    // Insights Section
    if (submission.insights && submission.insights.length > 0) {
      sections.push({
        id: 'insights',
        title: 'Key Insights',
        items: [{
          type: 'list',
          content: submission.insights.map((i: string) => `* ${i}`).join('\n'),
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
          content: findings.map(f => `* ${f}`).join('\n'),
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
          content: recommendations.map(r => `* ${r}`).join('\n'),
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
      const roadmapItems: any[] = []; // Changed to any[]
      if (submission.roadmap.phase1 && submission.roadmap.phase1.length > 0) {
        roadmapItems.push({
          type: 'paragraph',
          content: '<strong>Phase 1: Quick Wins (0 to 3 Months)</strong>',
        });
        roadmapItems.push({
          type: 'list',
          content: submission.roadmap.phase1.map((item: string) => `* ${item}`).join('\n'),
        });
      }
      if (submission.roadmap.phase2 && submission.roadmap.phase2.length > 0) {
        roadmapItems.push({
          type: 'paragraph',
          content: '<strong>Phase 2: Strategic Expansion (3 to 6 Months)</strong>',
        });
        roadmapItems.push({
          type: 'list',
          content: submission.roadmap.phase2.map((item: string) => `* ${item}`).join('\n'),
        });
      }
      if (submission.roadmap.phase3 && submission.roadmap.phase3.length > 0) {
        roadmapItems.push({
          type: 'paragraph',
          content: '<strong>Phase 3: Long-term Scale (6 to 12 Months)</strong>',
        });
        roadmapItems.push({
          type: 'list',
          content: submission.roadmap.phase3.map((item: string) => `* ${item}`).join('\n'),
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
              {
                label: "Spend",
                value: mapScoreToRAGStatus(submission.scorecard?.spend),
                bgColor: getColorConfig(mapScoreToRAGStatus(submission.scorecard?.spend)).bgColor || "",
                textColor: getColorConfig(mapScoreToRAGStatus(submission.scorecard?.spend)).textColor || "",
                borderColor: getColorConfig(mapScoreToRAGStatus(submission.scorecard?.spend)).borderColor || "",
                dotColor: getColorConfig(mapScoreToRAGStatus(submission.scorecard?.spend)).dotColor || "",
                labelColor: getColorConfig(mapScoreToRAGStatus(submission.scorecard?.spend)).labelColor || "",
              },
              {
                label: "Architecture",
                value: mapScoreToRAGStatus(submission.scorecard?.architecture),
                bgColor: getColorConfig(mapScoreToRAGStatus(submission.scorecard?.architecture)).bgColor || "",
                textColor: getColorConfig(mapScoreToRAGStatus(submission.scorecard?.architecture)).textColor || "",
                borderColor: getColorConfig(mapScoreToRAGStatus(submission.scorecard?.architecture)).borderColor || "",
                dotColor: getColorConfig(mapScoreToRAGStatus(submission.scorecard?.architecture)).dotColor || "",
                labelColor: getColorConfig(mapScoreToRAGStatus(submission.scorecard?.architecture)).labelColor || "",
              },
              {
                label: "Pain",
                value: mapScoreToRAGStatus(submission.scorecard?.pain),
                bgColor: getColorConfig(mapScoreToRAGStatus(submission.scorecard?.pain)).bgColor || "",
                textColor: getColorConfig(mapScoreToRAGStatus(submission.scorecard?.pain)).textColor || "",
                borderColor: getColorConfig(mapScoreToRAGStatus(submission.scorecard?.pain)).borderColor || "",
                dotColor: getColorConfig(mapScoreToRAGStatus(submission.scorecard?.pain)).dotColor || "",
                labelColor: getColorConfig(mapScoreToRAGStatus(submission.scorecard?.pain)).labelColor || "",
              },
            ]
          : [
              {
                label: "AI Readiness",
                value: mapScoreToRAGStatus(submission.scorecard?.readiness),
                bgColor: getColorConfig(mapScoreToRAGStatus(submission.scorecard?.readiness)).bgColor || "",
                textColor: getColorConfig(mapScoreToRAGStatus(submission.scorecard?.readiness)).textColor || "",
                borderColor: getColorConfig(mapScoreToRAGStatus(submission.scorecard?.readiness)).borderColor || "",
                dotColor: getColorConfig(mapScoreToRAGStatus(submission.scorecard?.readiness)).dotColor || "",
                labelColor: getColorConfig(mapScoreToRAGStatus(submission.scorecard?.readiness)).labelColor || "",
              },
              {
                label: "Business Value",
                value: mapScoreToRAGStatus(submission.scorecard?.value),
                bgColor: getColorConfig(mapScoreToRAGStatus(submission.scorecard?.value)).bgColor || "",
                textColor: getColorConfig(mapScoreToRAGStatus(submission.scorecard?.value)).textColor || "",
                borderColor: getColorConfig(mapScoreToRAGStatus(submission.scorecard?.value)).borderColor || "",
                dotColor: getColorConfig(mapScoreToRAGStatus(submission.scorecard?.value)).dotColor || "",
                labelColor: getColorConfig(mapScoreToRAGStatus(submission.scorecard?.value)).labelColor || "",
              },
              {
                label: "Opportunity",
                value: mapScoreToRAGStatus(submission.scorecard?.opportunity),
                bgColor: getColorConfig(mapScoreToRAGStatus(submission.scorecard?.opportunity)).bgColor || "",
                textColor: getColorConfig(mapScoreToRAGStatus(submission.scorecard?.opportunity)).textColor || "",
                borderColor: getColorConfig(mapScoreToRAGStatus(submission.scorecard?.opportunity)).borderColor || "",
                dotColor: getColorConfig(mapScoreToRAGStatus(submission.scorecard?.opportunity)).dotColor || "",
                labelColor: getColorConfig(mapScoreToRAGStatus(submission.scorecard?.opportunity)).labelColor || "",
              },
            ],
      },
      tier: submission.tier,
      confidenceScore: submission.confidenceScore,
      logoBase64: await loadLogoBase64(),
    };

    // ── 7. Generate Email HTML ────────────────────────────────────────────────
    const htmlContent = renderReportToHtml(reportData, { mode: 'email' });


    // ── 8. Generate PDF and Attach to Email ──────────────────────────────────────
    const pdfBuffer = await generatePdf(reportData);
    const pdfBase64 = pdfBuffer.toString("base64");
    const pdfFileName = isCost ? "audit-cost-scan.pdf" : "opportunity-audit.pdf";

    console.log(`[send-report] Generated PDF (${(pdfBuffer.length / 1024).toFixed(2)} KB) for submission ${submissionId}`);

    // ── 9. Send email with PDF attachment via Brevo ─────────────────────────────
    const senderEmail = process.env.BREVO_SENDER_EMAIL || "consulting@pixelpunch.org";
    const senderName  = process.env.BREVO_SENDER_NAME  || "Pixel Punch Consulting";
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
        htmlContent, // Use the generated htmlContent
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
