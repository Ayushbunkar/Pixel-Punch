import { NextRequest, NextResponse } from "next/server";
import { getSubmission } from "@/shared/database/db.service";

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

// Helper to convert basic Markdown to simple HTML
function mdToHtml(markdown: string): string {
  if (!markdown) return "";
  return markdown
    .replace(/^# (.*$)/gim, '<h1 style="color: #1e1b4b; font-size: 24px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin-top: 24px;">$1</h1>')
    .replace(/^## (.*$)/gim, '<h2 style="color: #1e1b4b; font-size: 20px; margin-top: 20px;">$1</h2>')
    .replace(/^### (.*$)/gim, '<h3 style="color: #312e81; font-size: 16px; margin-top: 16px; font-weight: bold;">$1</h3>')
    .replace(/^\* (.*$)/gim, '<li style="margin-bottom: 6px;">$1</li>')
    .replace(/^- (.*$)/gim, '<li style="margin-bottom: 6px;">$1</li>')
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/\n/g, "<br />");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { submissionId, email, scanType } = body;

    if (!submissionId || !email) {
      return NextResponse.json({ error: "Missing required fields: submissionId and email are required." }, { status: 400 });
    }

    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Email service is not configured (BREVO_API_KEY is missing)." }, { status: 500 });
    }

    // 1. Fetch submission details
    const submission = await getSubmission(submissionId);
    if (!submission) {
      return NextResponse.json({ error: "Assessment record not found." }, { status: 404 });
    }

    const isCost = scanType === "cost" || !!submission.scorecard?.spend;
    const companyName = submission.company?.name || submission.answers?.company || "your company";
    const reportTitle = isCost ? "AI Cost Architecture Audit" : "AI Opportunity Audit & Roadmap";

    // 2. Build HTML Body
    let scoresHtml = "";
    if (isCost) {
      const spend = submission.scorecard?.spend || submission.score?.spend || "unknown";
      const arch = submission.scorecard?.architecture || submission.score?.architecture || "unknown";
      const pain = submission.scorecard?.pain || submission.score?.pain || "unknown";
      scoresHtml = `
        <tr style="font-size: 13px; font-weight: bold; text-align: center;">
          <td style="padding: 10px; border: 1px solid #cbd5e1; background: #f8fafc;">Spend & Visibility</td>
          <td style="padding: 10px; border: 1px solid #cbd5e1; background: #f8fafc;">Architecture & Leakage</td>
          <td style="padding: 10px; border: 1px solid #cbd5e1; background: #f8fafc;">Business Pain</td>
        </tr>
        <tr style="font-size: 14px; text-align: center; text-transform: uppercase; font-weight: 800;">
          <td style="padding: 12px; border: 1px solid #cbd5e1; color: ${spend === "red" ? "#be123c" : spend === "amber" ? "#b45309" : "#047857"};">${spend}</td>
          <td style="padding: 12px; border: 1px solid #cbd5e1; color: ${arch === "red" ? "#be123c" : arch === "amber" ? "#b45309" : "#047857"};">${arch}</td>
          <td style="padding: 12px; border: 1px solid #cbd5e1; color: ${pain === "red" ? "#be123c" : pain === "amber" ? "#b45309" : "#047857"};">${pain}</td>
        </tr>
      `;
    } else {
      const readiness = submission.scorecard?.readiness || submission.score?.readiness || "unknown";
      const value = submission.scorecard?.value || submission.score?.value || "unknown";
      const opportunity = submission.scorecard?.opportunity || submission.score?.opportunity || "unknown";
      scoresHtml = `
        <tr style="font-size: 13px; font-weight: bold; text-align: center;">
          <td style="padding: 10px; border: 1px solid #cbd5e1; background: #f8fafc;">AI Readiness</td>
          <td style="padding: 10px; border: 1px solid #cbd5e1; background: #f8fafc;">Business Value</td>
          <td style="padding: 10px; border: 1px solid #cbd5e1; background: #f8fafc;">Automation Opportunity</td>
        </tr>
        <tr style="font-size: 14px; text-align: center; text-transform: uppercase; font-weight: 800;">
          <td style="padding: 12px; border: 1px solid #cbd5e1; color: ${readiness === "red" ? "#be123c" : readiness === "amber" ? "#b45309" : "#047857"};">${readiness}</td>
          <td style="padding: 12px; border: 1px solid #cbd5e1; color: ${value === "red" ? "#be123c" : value === "amber" ? "#b45309" : "#047857"};">${value}</td>
          <td style="padding: 12px; border: 1px solid #cbd5e1; color: ${opportunity === "red" ? "#be123c" : opportunity === "amber" ? "#b45309" : "#047857"};">${opportunity}</td>
        </tr>
      `;
    }

    const reportContentHtml = submission.auditReport 
      ? mdToHtml(submission.auditReport) 
      : `<p style="color: #475569; font-size: 14px; line-height: 1.6;">No detailed audit report text is available for this scan ID.</p>`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Your AI Scan Report</title>
      </head>
      <body style="font-family: 'Inter', Helvetica, Arial, sans-serif; background-color: #faf9f6; margin: 0; padding: 20px; color: #334155;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <!-- Header Banner -->
          <tr>
            <td style="padding: 32px 24px; background: #0f172a; text-align: center; color: #ffffff;">
              <h1 style="margin: 0; font-size: 22px; font-weight: 800; tracking-wide;">⚡ PIXEL PUNCH AI</h1>
              <p style="margin: 8px 0 0 0; color: #94a3b8; font-size: 12px; font-weight: 600; text-transform: uppercase;">Custom Scan Results & Audit Report</p>
            </td>
          </tr>
          
          <!-- Content Body -->
          <tr>
            <td style="padding: 32px 24px;">
              <h2 style="margin-top: 0; font-size: 18px; color: #0f172a; font-weight: bold;">
                Your ${reportTitle} is Ready
              </h2>
              <p style="font-size: 14px; line-height: 1.6; color: #475569;">
                Hello, <br />
                We have compiled the scan results for <strong>${companyName}</strong>. Below you will find the scorecard overview and the consultative technical audit report.
              </p>

              <!-- Scorecard Box -->
              <h3 style="margin-top: 24px; margin-bottom: 12px; font-size: 14px; text-transform: uppercase; color: #0f172a; font-weight: bold; letter-spacing: 0.5px;">
                RAG Dashboard Overview:
              </h3>
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; margin-bottom: 24px;">
                ${scoresHtml}
              </table>

              <!-- Detailed Report Body -->
              <div style="border-top: 1px solid #f1f5f9; padding-top: 12px;">
                ${reportContentHtml}
              </div>
            </td>
          </tr>
          
          <!-- Call To Action & Footer -->
          <tr>
            <td style="padding: 24px; background: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #64748b;">
              <p style="margin: 0 0 12px 0; font-weight: bold; color: #334155;">Ready to review your custom roadmap with an AI Architect?</p>
              <a href="https://pixelpunch.org/services/consulting" target="_blank" style="display: inline-block; padding: 10px 20px; background: #4f46e5; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 13px; margin-bottom: 16px;">
                Schedule Free 15-Min Scoping Call
              </a>
              <p style="margin: 0;">This report was automatically compiled for you by Pixel Punch AI.</p>
              <p style="margin: 4px 0 0 0;">&copy; 2026 Pixel Punch. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    // 3. Post to Brevo API
    const response = await fetch(BREVO_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey
      },
      body: JSON.stringify({
        sender: {
          name: "Pixel Punch Consulting",
          email: "consulting@pixelpunch.org"
        },
        to: [
          {
            email: email,
            name: `${submission.contact?.firstname ?? ""} ${submission.contact?.lastname ?? ""}`.trim() || undefined
          }
        ],
        subject: `Your ${reportTitle} Report — Pixel Punch`,
        htmlContent: htmlContent
      })
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("[send-report] Brevo transaction API failed:", response.status, text);
      return NextResponse.json({ error: `Failed to send email. API status: ${response.status}` }, { status: 502 });
    }

    return NextResponse.json({ success: true, message: "Report email sent successfully!" }, { status: 200 });

  } catch (error: any) {
    console.error("[send-report] Unexpected error during email send:", error);
    return NextResponse.json({ error: error?.message || "An unexpected server error occurred." }, { status: 500 });
  }
}
