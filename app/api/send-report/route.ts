import { NextRequest, NextResponse } from "next/server";
import { getSubmission } from "@/shared/database/db.service";
import { submissionCache as costCache } from "../cost-scan/submit/route";
import { submissionCache as oppCache } from "../opportunity-scan/submit/route";

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
// Markdowdfdf s  jbkj n → clean HTML (proper list wrapping, no stray <br> inside <li>)
// ─────────────────────────────────────────────────────────────────────────────
function mdToHtml(markdown: string): string {
  if (!markdown) return "";

  const lines = markdown.split(/\r?\n/);
  const result: string[] = [];
  let inList = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Headings
    if (/^### (.+)/.test(line)) {
      if (inList) { result.push("</ul>"); inList = false; }
      result.push(`<h3 style="color:#312e81;font-size:15px;margin:20px 0 6px 0;font-weight:700;">${line.replace(/^### /, "")}</h3>`);
    } else if (/^## (.+)/.test(line)) {
      if (inList) { result.push("</ul>"); inList = false; }
      result.push(`<h2 style="color:#1e1b4b;font-size:18px;margin:24px 0 8px 0;font-weight:700;border-bottom:1px solid #e2e8f0;padding-bottom:6px;">${line.replace(/^## /, "")}</h2>`);
    } else if (/^# (.+)/.test(line)) {
      if (inList) { result.push("</ul>"); inList = false; }
      result.push(`<h1 style="color:#0f172a;font-size:22px;margin:28px 0 10px 0;font-weight:800;">${line.replace(/^# /, "")}</h1>`);

    // Bullet points
    } else if (/^[\*\-] (.+)/.test(line)) {
      if (!inList) { result.push('<ul style="margin:8px 0 8px 0;padding-left:20px;">'); inList = true; }
      const content = line.replace(/^[\*\-] /, "").replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\*(.*?)\*/g, "<em>$1</em>");
      result.push(`<li style="margin-bottom:5px;color:#475569;font-size:14px;line-height:1.6;">${content}</li>`);

    // Empty line
    } else if (line.trim() === "") {
      if (inList) { result.push("</ul>"); inList = false; }
      result.push('<br style="line-height:0;display:block;margin:4px 0;">');

    // Normal paragraph
    } else {
      if (inList) { result.push("</ul>"); inList = false; }
      const content = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\*(.*?)\*/g, "<em>$1</em>");
      result.push(`<p style="margin:6px 0;font-size:14px;line-height:1.7;color:#475569;">${content}</p>`);
    }
  }

  if (inList) result.push("</ul>");
  return result.join("\n");
}

// ─────────────────────────────────────────────────────────────────────────────
// RAG badge colour helper
// ─────────────────────────────────────────────────────────────────────────────
function ragColor(rag: string): { bg: string; text: string; label: string } {
  switch (rag?.toLowerCase()) {
    case "red":   return { bg: "#fee2e2", text: "#be123c", label: "HIGH RISK" };
    case "amber": return { bg: "#fef3c7", text: "#b45309", label: "MEDIUM RISK" };
    case "green": return { bg: "#dcfce7", text: "#15803d", label: "LOW RISK" };
    default:      return { bg: "#f1f5f9", text: "#64748b", label: rag?.toUpperCase() || "N/A" };
  }
}

function ragBadge(label: string, rag: string): string {
  const c = ragColor(rag);
  return `
    <td style="padding:12px 8px;text-align:center;width:33%;">
      <div style="border-radius:10px;padding:10px 8px;background:${c.bg};border:1px solid ${c.text}22;">
        <div style="font-size:11px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">${label}</div>
        <div style="font-size:15px;font-weight:800;color:${c.text};">${c.label}</div>
        <div style="font-size:11px;font-weight:500;color:${c.text};margin-top:2px;">● ${rag?.toUpperCase() || "N/A"}</div>
      </div>
    </td>`;
}

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
      "your company";
    const recipientName =
      `${submission.contact?.firstname ?? ""} ${submission.contact?.lastname ?? ""}`.trim() ||
      undefined;
    const reportTitle = isCost ? "AI Cost Architecture Audit" : "AI Opportunity Audit & Roadmap";

    // ── 3. Build RAG scorecard badges ─────────────────────────────────────────
    let scorecardHtml = "";
    if (isCost) {
      const spend = submission.scorecard?.spend || submission.score?.spend || "unknown";
      const arch  = submission.scorecard?.architecture || submission.score?.architecture || "unknown";
      const pain  = submission.scorecard?.pain || submission.score?.pain || "unknown";
      scorecardHtml = `
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
          <tr>
            ${ragBadge("Spend & Visibility", spend)}
            ${ragBadge("Architecture & Leakage", arch)}
            ${ragBadge("Business Pain", pain)}
          </tr>
        </table>`;
    } else {
      const readiness   = submission.scorecard?.readiness   || submission.score?.readiness   || "unknown";
      const value       = submission.scorecard?.value       || submission.score?.value       || "unknown";
      const opportunity = submission.scorecard?.opportunity || submission.score?.opportunity || "unknown";
      scorecardHtml = `
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
          <tr>
            ${ragBadge("AI Readiness", readiness)}
            ${ragBadge("Business Value", value)}
            ${ragBadge("Automation Opportunity", opportunity)}
          </tr>
        </table>`;
    }

    // ── 4. Build audit report body ────────────────────────────────────────────
    const reportHtml = submission.auditReport
      ? mdToHtml(submission.auditReport)
      : `<p style="color:#475569;font-size:14px;line-height:1.6;">Your detailed audit analysis is being compiled. A follow-up report will be sent once complete.</p>`;

    // ── 5. Recommendations list ───────────────────────────────────────────────
    const recommendations: string[] =
      submission.recommendations
        ?.filter((r: any) => typeof r === "string")
        .slice(0, 5) || [];
    const recsHtml = recommendations.length > 0
      ? `<ul style="margin:8px 0;padding-left:20px;">
          ${recommendations.map((r: string) =>
            `<li style="margin-bottom:8px;font-size:14px;color:#475569;line-height:1.6;">${r}</li>`
          ).join("")}
        </ul>`
      : "";

    // ── 6. Results page URL ───────────────────────────────────────────────────
    const host = req.headers.get("host") || "pixelpunch.org";
    const protocol = host.includes("localhost") ? "http" : "https";
    const origin = `${protocol}://${host}`;
    const resultsPageUrl = isCost
      ? `${origin}/ai/cost-scan/results?id=${submissionId}`
      : `${origin}/ai/opportunity-scan/results?id=${submissionId}`;

    // ── 7. Full HTML email template ───────────────────────────────────────────
    const senderEmail = process.env.BREVO_SENDER_EMAIL || "consulting@pixelpunch.org";
    const senderName  = process.env.BREVO_SENDER_NAME  || "Pixel Punch Consulting";

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your ${reportTitle} — Pixel Punch</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background:#f1f5f9;padding:24px 16px;">
    <tr>
      <td align="center">
        <table border="0" cellpadding="0" cellspacing="0" width="600" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- ░░ HEADER ░░ -->
          <tr>
            <td style="background:linear-gradient(135deg,#0f172a 0%,#1e1b4b 100%);padding:32px 32px 28px 32px;text-align:center;">
              <div style="display:inline-block;background:rgba(255,255,255,0.1);border-radius:10px;padding:6px 16px;margin-bottom:16px;">
                <span style="color:#a5b4fc;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;">⚡ Pixel Punch AI</span>
              </div>
              <h1 style="margin:0;font-size:24px;font-weight:800;color:#ffffff;line-height:1.3;">Your ${reportTitle}<br>Report is Ready</h1>
              <p style="margin:12px 0 0 0;color:#94a3b8;font-size:13px;">Compiled exclusively for <strong style="color:#c7d2fe;">${companyName}</strong></p>
            </td>
          </tr>

          <!-- ░░ GREETING ░░ -->
          <tr>
            <td style="padding:28px 32px 0 32px;">
              <p style="margin:0;font-size:15px;color:#334155;line-height:1.7;">
                Hello${recipientName ? ` <strong>${recipientName}</strong>` : ""},
              </p>
              <p style="margin:10px 0 0 0;font-size:14px;color:#64748b;line-height:1.7;">
                Your AI scan is complete. We've compiled your personalised scorecard and a full consultative audit report below.
                Use the results to benchmark your current AI position and identify the highest-impact improvements.
              </p>
            </td>
          </tr>

          <!-- ░░ RAG SCORECARD ░░ -->
          <tr>
            <td style="padding:24px 32px 0 32px;">
              <div style="background:#f8fafc;border-radius:12px;padding:20px;border:1px solid #e2e8f0;">
                <p style="margin:0 0 14px 0;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#94a3b8;">📊 RAG Dashboard Overview</p>
                ${scorecardHtml}
              </div>
            </td>
          </tr>

          <!-- ░░ DIVIDER ░░ -->
          <tr>
            <td style="padding:28px 32px 0 32px;">
              <div style="border-top:1px solid #e2e8f0;"></div>
              <p style="margin:20px 0 8px 0;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#94a3b8;">📋 Full Audit Report</p>
            </td>
          </tr>

          <!-- ░░ AUDIT REPORT BODY ░░ -->
          <tr>
            <td style="padding:0 32px 0 32px;">
              <div style="font-size:14px;color:#475569;line-height:1.7;">
                ${reportHtml}
              </div>
            </td>
          </tr>

          ${recsHtml ? `
          <!-- ░░ RECOMMENDATIONS ░░ -->
          <tr>
            <td style="padding:24px 32px 0 32px;">
              <div style="background:#f0fdf4;border-radius:12px;padding:20px;border:1px solid #bbf7d0;">
                <p style="margin:0 0 12px 0;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#15803d;">✅ Top Recommendations</p>
                ${recsHtml}
              </div>
            </td>
          </tr>` : ""}

          <!-- ░░ CTA BUTTONS ░░ -->
          <tr>
            <td style="padding:28px 32px 0 32px;">
              <div style="background:#f8fafc;border-radius:12px;padding:24px;border:1px solid #e2e8f0;text-align:center;">
                <p style="margin:0 0 16px 0;font-size:14px;font-weight:600;color:#0f172a;">Ready to review your full roadmap with an AI Architect?</p>
                <table border="0" cellpadding="0" cellspacing="0" style="margin:0 auto;">
                  <tr>
                    <td style="padding:0 6px;">
                      <a href="${resultsPageUrl}&download=pdf" target="_blank"
                         style="display:inline-block;padding:12px 22px;background:#0f172a;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:700;font-size:13px;letter-spacing:0.3px;">
                        Download PDF Report
                      </a>
                    </td>
                    <td style="padding:0 6px;">
                      <a href="https://pixelpunch.org/services/consulting" target="_blank"
                         style="display:inline-block;padding:12px 22px;background:#4f46e5;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:700;font-size:13px;letter-spacing:0.3px;">
                        Book Free Scoping Call
                      </a>
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>

          <!-- ░░ FOOTER ░░ -->
          <tr>
            <td style="padding:24px 32px 32px 32px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6;">
                This report was automatically compiled by <strong>Pixel Punch AI</strong>.<br>
                © 2026 Pixel Punch. All rights reserved.<br>
                <a href="https://pixelpunch.org" style="color:#6366f1;text-decoration:none;">pixelpunch.org</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    // ── 8. Send via Brevo Transactional API ───────────────────────────────────
    const response = await fetch(BREVO_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify({
        sender:      { name: senderName, email: senderEmail },
        to:          [{ email, name: recipientName }],
        subject:     `Your ${reportTitle} Report — Pixel Punch`,
        htmlContent,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("[send-report] Brevo API error:", response.status, text);

      // In dev or if API key has sandbox restrictions, log and return success
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

    console.log(`[send-report] Email sent successfully to ${email} for submission ${submissionId}`);
    return NextResponse.json({ success: true, message: "Report email sent successfully!" }, { status: 200 });

  } catch (error: any) {
    console.error("[send-report] Unexpected error:", error);
    return NextResponse.json(
      { error: error?.message || "An unexpected server error occurred." },
      { status: 500 }
    );
  }
}
