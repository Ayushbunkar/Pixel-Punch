import { getSubmission } from "@/shared/database/db.service";
import { generatePdf, loadLogoBase64 } from "@/shared/utils/pdf-generator";
import { ReportData, renderReportToHtml, getColorConfig } from "@/shared/utils/report-content-generator";

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";
//ghf
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

export async function sendReportEmail(
  submissionId: string,
  email: string,
  scanType: string,
  recipientName?: string,
) {
  try {
    console.log(`[email.provider] sendReportEmail called for submissionId: ${submissionId}, email: ${email}`);
    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) {
      console.error("Email service is not configured (BREVO_API_KEY is missing).");
      return { success: false, error: "Email service not configured." };
    }

    let submission = await getSubmission(submissionId);

    console.log(`[email.provider] Type of submission: ${typeof submission}`);
    if (submission) {
      console.log(`[email.provider] Keys in submission object: ${Object.keys(submission).join(', ')}`);
    }

    if (!submission) {
      console.error(`[email.provider] Submission ${submissionId} not found.`);
      return { success: false, error: "Submission not found." };
    }

    console.log(`[email.provider] Retrieved submission: ${JSON.stringify(submission, null, 2)}`);

    // Ensure scorecard and score are present to avoid errors
    if (!submission.scorecard && !submission.score) {
      console.error(`[email.provider] Submission ${submissionId} is missing scorecard/score data.`);
      return { success: false, error: "Submission missing scorecard/score data." };
    }

    const isCost = scanType === "cost" || !!submission.scorecard?.spend || !!submission.score?.spend;
    const companyName =
      submission.company?.name ||
      submission.contact?.company ||
      submission.answers?.company ||
      submission.answers?.company_name ||
      submission.costAnalysis?.normalizedData?.provider ||
      (submission.contact?.firstname ? undefined : undefined) ||
      "N/A";
    const reportTitle = isCost ? "AI Cost Audit" : "AI Opportunity Audit";
    const companySize = submission.answers?.company_size || submission.company?.size || "small-to-midsize";
    const businessType = submission.answers?.business_type || submission.company?.type || "technology";

    const sections: any[] = [];
    const metadata: { [key: string]: string } = {};

    metadata['Submission ID'] = submissionId;
    if (companyName) metadata['Company'] = companyName;
    if (recipientName) metadata['Contact'] = recipientName;
    metadata['Company Size'] = companySize;
    metadata['Business Type'] = businessType;

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

    if (submission.roadmap) {
      const roadmapItems: any[] = [];
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

    console.log(`[email.provider] ReportData constructed: ${JSON.stringify(reportData, null, 2)}`);

    let htmlContent: string;
    try {
      htmlContent = renderReportToHtml(reportData, { mode: 'email' });
    } catch (err) {
      console.error("[email.provider] Error rendering report to HTML:", err);
      return { success: false, error: "Failed to render report HTML." };
    }

    let pdfBuffer: Buffer;
    try {
      pdfBuffer = await generatePdf(reportData);
    } catch (err) {
      console.error("[email.provider] Error generating PDF:", err);
      return { success: false, error: "Failed to generate PDF report." };
    }
    const pdfBase64 = pdfBuffer.toString("base64");
    const pdfFileName = isCost ? "audit-cost-scan.pdf" : "opportunity-audit.pdf";

    console.log(`[email.provider] Generated PDF (${(pdfBuffer.length / 1024).toFixed(2)} KB) for submission ${submissionId}`);

    const senderEmail = process.env.BREVO_SENDER_EMAIL || "consulting@pixelpunch.org";
    const senderName  = process.env.BREVO_SENDER_NAME  || "Pixel Punch Consulting";

    console.log(`[email.provider] Attempting to send email to ${email} from ${senderEmail} with subject: Your ${reportTitle} Report — Pixel Punch`);
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
        htmlContent,
        attachment: [
          {
            name: pdfFileName,
            content: pdfBase64,
          },
        ],
      }),
    });

    console.log(`[email.provider] Brevo API response status: ${response.status}`);

    if (!response.ok) {
      const text = await response.text();
      console.error("[email.provider] Brevo API error:", response.status, text);
      return { success: false, error: `Brevo API returned status ${response.status}.` };
    }

    console.log(`[email.provider] Email sent successfully to ${email} with attachment ${pdfFileName} for submission ${submissionId}`);
    return { success: true, message: "Report email sent successfully with PDF attachment!" };

  } catch (error: any) {
    console.error("[email.provider] Unexpected error:", error);
    return { success: false, error: error?.message || "An unexpected server error occurred." };
  }
}
