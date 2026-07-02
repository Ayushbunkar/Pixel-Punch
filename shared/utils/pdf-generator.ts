import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium-min";
import fs from "fs";
import path from "path";

// ── Shared PDF Report Types ────────────────────────────────────────────────────────
export interface PdfReportData {
  submissionId: string;
  companyName?: string;
  contactName?: string;
  reportTitle: string;
  reportType: "cost" | "opportunity";
  scorecard: {
    dimensions: Array<{
      label: string;
      value: "red" | "amber" | "green";
      bgColor: string;
      textColor: string;
      borderColor: string;
      dotColor: string;
      labelColor: string;
    }>;
  };
  tier?: 1 | 2 | 3 | 4;
  insights?: string[];
  findings?: string[];
  recommendations?: string[];
  auditReport?: string;
  confidenceScore?: string;
  roadmap?: {
    phase1: string[];
    phase2: string[];
    phase3: string[];
  };
}

// ── RAG Color Config ───────────────────────────────────────────────────────────────
export const RAG_COLORS = {
  red:   { bg: "#fee2e2",  text: "#dc2626",  border: "#fca5a5", dot: "#dc2626",  label: "Action Needed" },
  amber: { bg: "#fffbeb",  text: "#d97706",  border: "#fcd34d", dot: "#d97706",  label: "Needs Attention" },
  green: { bg: "#f0fdf4",  text: "#16a34a",  border: "#86efac", dot: "#16a34a",  label: "Looking Good" },
};

// ── Tier Styles ─────────────────────────────────────────────────────────────────────
const TIER_STYLES = {
  1: { bg: "#fff1f2", text: "#be123c", border: "#fca5a5", badge: "#dc2626", description: "An immediate, full AI Cost Audit is strongly recommended to stop active cost leakage." },
  2: { bg: "#fffbeb", text: "#92400e", border: "#fcd34d", badge: "#d97706", description: "A targeted architectural optimization sprint is advised to reduce identified waste." },
  3: { bg: "#f0fdf4", text: "#14532d", border: "#86efac", badge: "#16a34a", description: "Periodic monitoring and a lightweight quarterly review is suggested." },
  4: { bg: "#f8fafc", text: "#334155", border: "#e2e8f0", badge: "#64748b", description: "No immediate action required at your current scale." },
};

function getTierStyles(tier: number) {
  return TIER_STYLES[tier as keyof typeof TIER_STYLES] || TIER_STYLES[4];
}

// ── Render Markdown ─────────────────────────────────────────────────────────────────
function renderMarkdown(text: string): string {
  if (!text) return "";
  
  // Format headers
  let html = text
    .replace(/^### (.*$)/gim, '<h3 style="color:#1e293b;font-size:12px;font-weight:700;margin:16px 0 6px 0">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 style="color:#0f172a;font-size:14px;font-weight:800;margin:20px 0 8px 0">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 style="color:#0f172a;font-size:16px;font-weight:900;margin:24px 0 10px 0">$1</h1>');

  // Handle markdown bullet formatting
  const lines = html.split("\n");
  let inList = false;
  const processedLines = lines.map(line => {
    let trimmed = line.trim();
    if (/^[*\-•]\s*/.test(trimmed)) {
      const bulletContent = trimmed.replace(/^[*\-•]\s*/, "");
      const listStyle = 'style="margin-bottom:4px;color:#475569;font-size:9.5px;line-height:1.5"';
      let content = bulletContent
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.*?)\*/g, "<em>$1</em>");
      return `<li ${listStyle}>${content}</li>`;
    } else {
      if (trimmed === "---" || trimmed === "***" || trimmed === "___") {
        return '<hr style="border:0;border-top:1px solid #e2e8f0;margin:12px 0" />';
      }
      return trimmed
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.*?)\*/g, "<em>$1</em>");
    }
  });

  return processedLines.join("\n");
}

// ── Build PDF HTML for Cost Audit ────────────────────────────────────────────────────
function buildCostAuditHtml(data: PdfReportData, logoBase64: string): string {
  const tier = data.tier || 4;
  const tierStyles = getTierStyles(tier);
  const today = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
  const reportId = data.submissionId.slice(0, 8).toUpperCase();

  const getCostDesc = (lbl: string) => {
    const l = lbl.toLowerCase();
    if (l.includes("spend")) return "Monthly spend rate and financial overhead visibility.";
    if (l.includes("arch")) return "Operational dependencies and single-point architecture leakage.";
    return "Manual team bottlenecks and critical tool integrations pain.";
  };

  const scorecardRows = data.scorecard.dimensions.map(dim => `
    <td style="padding:12px 14px;background:${dim.bgColor};border:1px solid ${dim.borderColor};border-radius:8px;width:23%;height:125px;vertical-align:top">
      <p style="margin:0 0 4px 0;font-size:9.5px;font-weight:800;color:${dim.textColor};text-transform:uppercase;letter-spacing:0.3px">${dim.label}</p>
      <div style="display:flex;align-items:center;gap:5px;margin-bottom:6px">
        <div style="width:7px;height:7px;border-radius:50%;background:${dim.dotColor}"></div>
        <span style="font-size:10.5px;font-weight:700;color:${dim.textColor}">${dim.labelColor}</span>
      </div>
      <p style="margin:0 0 6px 0;font-size:7.5px;color:${dim.textColor};line-height:1.2;opacity:0.85">${getCostDesc(dim.label)}</p>
      <p style="margin:0;font-size:8.5px;color:${dim.textColor};font-weight:750;text-transform:uppercase">${dim.value}</p>
    </td>
  `).join("<td style='width:2.6%'></td>");

  const ragColor = (v: string) => v === "red" ? "#dc2626" : v === "amber" ? "#d97706" : "#16a34a";
  
  // Calculate SVG dash offset values based on 3 dimensions
  const circumference = 2 * Math.PI * 35; // ~219.91
  const sliceLength = circumference / 3;

  const costData = [
    { value: data.scorecard.dimensions[0]?.value || "green", color: ragColor(data.scorecard.dimensions[0]?.value || "green") },
    { value: data.scorecard.dimensions[1]?.value || "green", color: ragColor(data.scorecard.dimensions[1]?.value || "green") },
    { value: data.scorecard.dimensions[2]?.value || "green", color: ragColor(data.scorecard.dimensions[2]?.value || "green") },
  ];

  const svgPieChart = `
    <td style="width:23%;padding:12px 16px;background:#ffffff;border-radius:12px;border:1px solid #e2e8f0;text-align:center;vertical-align:middle;height:125px">
      <svg width="68" height="68" viewBox="0 0 100 100" style="transform:rotate(-90deg);margin:0 auto;display:block">
        <circle cx="50" cy="50" r="35" fill="none" stroke="#f1f5f9" stroke-width="14"/>
        <circle cx="50" cy="50" r="35" fill="none" stroke="${costData[0].color}" stroke-width="14" stroke-dasharray="${sliceLength} ${circumference}" stroke-dashoffset="0"/>
        <circle cx="50" cy="50" r="35" fill="none" stroke="${costData[1].color}" stroke-width="14" stroke-dasharray="${sliceLength} ${circumference}" stroke-dashoffset="-${sliceLength}"/>
        <circle cx="50" cy="50" r="35" fill="none" stroke="${costData[2].color}" stroke-width="14" stroke-dasharray="${sliceLength} ${circumference}" stroke-dashoffset="-${sliceLength * 2}"/>
      </svg>
      <div style="display:flex;gap:6px;margin-top:6px;justify-content:center;font-size:7px;color:#64748b">
        <span>● Spend</span>
        <span>● Arch</span>
        <span>● Pain</span>
      </div>
    </td>
  `;

  const tierHtml = tier ? `
    <tr style="page-break-inside:avoid">
      <td style="padding:16px;background:${tierStyles.bg};border:1.5px solid ${tierStyles.border};border-radius:12px">
        <table border="0" cellpadding="0" cellspacing="0" style="width:100%">
          <tr>
            <td style="vertical-align:top;padding-right:12px;width:40px">
              <div style="width:32px;height:32px;border-radius:8px;background:${tierStyles.badge};text-align:center;line-height:32px;font-size:15px;font-weight:900;color:#ffffff">${tier}</div>
            </td>
            <td style="vertical-align:top">
              <p style="margin:0 0 4px 0;font-size:9px;font-weight:800;color:${tierStyles.text};text-transform:uppercase;letter-spacing:0.8px">Tier ${tier} — Priority Assessment</p>
              <p style="margin:0;font-size:12px;font-weight:700;color:${tierStyles.text};line-height:1.5">${tierStyles.description}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
   ` : "";
   const insightsHtml = data.insights && data.insights.length > 0 ? `
    <tr style="page-break-inside:avoid">
      <td style="padding:16px 0">
        <p style="margin:0 0 10px 0;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#94a3b8">Key Insights</p>
        <table border="0" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse">
          ${data.insights.map((ins, i) => `
            <tr>
              <td style="padding:4px 0">
                <table border="0" cellpadding="0" cellspacing="0" style="width:100%;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px">
                  <tr>
                    <td style="padding:10px 12px">
                      <table border="0" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="vertical-align:top;padding-right:10px;width:20px">
                            <div style="width:20px;min-width:20px;font-size:12px;font-weight:800;color:#94a3b8;text-align:center">${i + 1}.</div>
                          </td>
                          <td style="vertical-align:top;font-size:11px;color:#334155">${renderMarkdown(ins)}</td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          `).join("")}
        </table>
      </td>
    </tr>
  ` : "";

  const findingsHtml = data.findings && data.findings.length > 0 ? `
    <tr style="page-break-inside:avoid">
      <td style="padding:16px 0">
        <table border="0" cellpadding="0" cellspacing="0" style="width:100%;background:#fff5f5;border:1px solid #fee2e2;border-radius:10px">
          <tr>
            <td style="padding:12px 14px">
              <p style="margin:0 0 8px 0;font-size:10.5px;font-weight:900;color:#b91c1c;text-transform:uppercase;letter-spacing:0.5px">Key Findings (${data.findings.length})</p>
              <ul style="margin:0;padding-left:20px">
                ${data.findings.map(f => `<li style="font-size:9.5px;color:#475569;margin-bottom:4px">${renderMarkdown(f)}</li>`).join("")}
              </ul>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  ` : "";

  const recommendationsHtml = data.recommendations && data.recommendations.length > 0 ? `
    <tr style="page-break-inside:avoid">
      <td style="padding:16px 0">
        <table border="0" cellpadding="0" cellspacing="0" style="width:100%;background:#f0fdf4;border:1px solid #dcfce7;border-radius:10px">
          <tr>
            <td style="padding:12px 14px">
              <p style="margin:0 0 8px 0;font-size:10.5px;font-weight:900;color:#15803d;text-transform:uppercase;letter-spacing:0.5px">Expert Recommendations (${data.recommendations.length})</p>
              <ul style="margin:0;padding-left:20px">
                ${data.recommendations.map(r => `<li style="font-size:9.5px;color:#475569;margin-bottom:4px">${renderMarkdown(r)}</li>`).join("")}
              </ul>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  ` : "";

  const auditReportHtml = data.auditReport ? `
    <tr style="page-break-inside:avoid">
      <td style="padding:16px 0">
        <table border="0" cellpadding="0" cellspacing="0" style="width:100%;background:#fafaf9;border:1px solid #f5f5f4;border-radius:10px">
          <tr>
            <td style="padding:16px 20px">
              <p style="margin:0 0 10px 0;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#94a3b8">Full Technical Audit</p>
              <div style="font-size:10px;color:#475569;line-height:1.6;white-space:pre-wrap">${renderMarkdown(data.auditReport)}</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  ` : "";

  const confidenceHtml = data.confidenceScore ? `
    <tr style="page-break-inside:avoid">
      <td style="padding:16px 0">
        <table border="0" cellpadding="0" cellspacing="0" style="width:100%;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px">
          <tr>
            <td style="padding:16px">
              <p style="margin:0 0 10px 0;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#94a3b8">Audit Confidence Level</p>
              <div style="display:flex;align-items:center;gap:20px;flex-wrap:wrap">
                <div style="flex:1;min-width:200px;background:#f8fafc;border-radius:10px;padding:20px;text-align:center;border:1px solid #e2e8f0">
                  <div style="font-size:32px;font-weight:900;color:${Number(data.confidenceScore.replace("%", "")) >= 70 ? "#16a34a" : Number(data.confidenceScore.replace("%", "")) >= 40 ? "#d97706" : "#dc2626"}">${data.confidenceScore}</div>
                  <div style="font-size:10px;color:#64748b;margin-top:8px;text-transform:uppercase;letter-spacing:1px">Confidence Score</div>
                </div>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  ` : "";

  const logoBase64 = "data:image/jpeg;base64,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";

  const fullHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <title>${data.reportTitle}</title>
      <style>
        body { margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #0f172a; }
        .pdf-container { width: 720px; margin: 0 auto; background: #fff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.07); page-break-inside:avoid; }
        .header { display: flex; justify-content: space-between; align-items: center; padding: 10px 0 20px 0; border-bottom: 1px solid #e2e8f0; margin-bottom: 20px; }
        .footer { margin-top: 40px; padding-top: 10px; border-top: 1px solid #e2e8f0; font-size: 9px; color: #94a3b8; text-align: center; }
        ul { margin: 0; padding-left: 20px; }
        li { margin-bottom: 6px; }
      </style>
    </head>
    <body>
      <div class="pdf-container">
        <div style="height: 5px; background: linear-gradient(90deg, #4f46e5 0%, #6366f1 100%);"></div>
        <div style="padding: 32px;">
          <div class="header">
            <div style="display:flex;align-items:center;gap:12px">
              <img src="${logoBase64}" alt="Pixel Punch" style="height:28px;width:auto;object-contain:true" />
              <div style="height:20px;width:1px;background:#e2e8f0"></div>
              <div>
                <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#64748b">AI Cost Architecture Diagnostics</div>
              </div>
            </div>
            <div style="text-align:right">
              <div style="font-size:10px;color:#64748b;margin-bottom:4px">Report Date: <strong style="color:#1e293b">${today}</strong></div>
              <div style="font-size:10px;color:#64748b;margin-bottom:8px">Ref: <strong style="color:#1e293b">#${reportId}</strong></div>
              <div style="display:inline-block;background:#eff6ff;border:1px solid #bfdbfe;border-radius:999px;padding:2px 10px;font-size:9px;font-weight:700;color:#1d4ed8;text-transform:uppercase;letter-spacing:0.5px">Confidential</div>
            </div>
          </div>
          <div style="margin:0 0 24px 0">
            <h1 style="margin:0 0 8px 0;font-size:20px;font-weight:800;color:#0f172a;line-height:1.3">${data.reportTitle}</h1>
            ${data.companyName ? `<p style="margin:0;font-size:11px;color:#64748b">For: <strong style="color:#334155">${data.companyName}</strong></p>` : ""}
          </div>
          <table border="0" cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:24px">
            <tr style="page-break-inside:avoid">
              <td style="width:63%;vertical-align:top">
                <table border="0" cellpadding="0" cellspacing="0" style="width:100%">
                  <tr>
                    ${scorecardRows}
                  </tr>
                </table>
              </td>
              <td style="width:2%"></td>
              ${svgPieChart}
            </tr>
          </table>
          ${tierHtml}
          ${insightsHtml}
          ${findingsHtml}
          ${recommendationsHtml}
          ${auditReportHtml}
          ${confidenceHtml}
          <div class="footer">
            <p>This report was automatically compiled by <strong>Pixel Punch AI</strong>.<br>
            Report ID: ${reportId} | © 2026 Pixel Punch. All rights reserved.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  return fullHtml;
}

// ── Build PDF HTML for Opportunity Audit ────────────────────────────────────────────
function buildOpportunityAuditHtml(data: PdfReportData): string {
  const today = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
  const reportId = data.submissionId.slice(0, 8).toUpperCase();

  const getOppDesc = (lbl: string) => {
    const l = lbl.toLowerCase();
    if (l.includes("readiness")) return "Infrastructure maturity, data availability, and tooling readiness.";
    if (l.includes("value")) return "Strategic business alignment and automated workflow ROI potential.";
    return "Identified workflow opportunities suited for agent automation.";
  };

  const scorecardRows = data.scorecard.dimensions.map(dim => `
    <td style="padding:12px 14px;background:${dim.bgColor};border:1px solid ${dim.borderColor};border-radius:8px;width:23%;height:125px;vertical-align:top">
      <p style="margin:0 0 4px 0;font-size:9.5px;font-weight:800;color:${dim.textColor};text-transform:uppercase;letter-spacing:0.3px">${dim.label}</p>
      <div style="display:flex;align-items:center;gap:5px;margin-bottom:6px">
        <div style="width:7px;height:7px;border-radius:50%;background:${dim.dotColor}"></div>
        <span style="font-size:10.5px;font-weight:700;color:${dim.textColor}">${dim.labelColor}</span>
      </div>
      <p style="margin:0 0 6px 0;font-size:7.5px;color:${dim.textColor};line-height:1.2;opacity:0.85">${getOppDesc(dim.label)}</p>
      <p style="margin:0;font-size:8.5px;color:${dim.textColor};font-weight:750;text-transform:uppercase">${dim.value}</p>
    </td>
  `).join("<td style='width:2.6%'></td>");

  const ragColor = (v: string) => v === "red" ? "#dc2626" : v === "amber" ? "#d97706" : "#16a34a";
  
  // Calculate SVG dash offset values based on 3 dimensions
  const circumference = 2 * Math.PI * 35; // ~219.91
  const sliceLength = circumference / 3;

  const oppData = [
    { value: data.scorecard.dimensions[0]?.value || "green", color: ragColor(data.scorecard.dimensions[0]?.value || "green") },
    { value: data.scorecard.dimensions[1]?.value || "green", color: ragColor(data.scorecard.dimensions[1]?.value || "green") },
    { value: data.scorecard.dimensions[2]?.value || "green", color: ragColor(data.scorecard.dimensions[2]?.value || "green") },
  ];

  const svgPieChart = `
    <td style="width:23%;padding:12px 16px;background:#ffffff;border-radius:12px;border:1px solid #e2e8f0;text-align:center;vertical-align:middle;height:110px">
      <svg width="72" height="72" viewBox="0 0 100 100" style="transform:rotate(-90deg);margin:0 auto;display:block">
        <circle cx="50" cy="50" r="35" fill="none" stroke="#f1f5f9" stroke-width="14"/>
        <circle cx="50" cy="50" r="35" fill="none" stroke="${oppData[0].color}" stroke-width="14" stroke-dasharray="${sliceLength} ${circumference}" stroke-dashoffset="0"/>
        <circle cx="50" cy="50" r="35" fill="none" stroke="${oppData[1].color}" stroke-width="14" stroke-dasharray="${sliceLength} ${circumference}" stroke-dashoffset="-${sliceLength}"/>
        <circle cx="50" cy="50" r="35" fill="none" stroke="${oppData[2].color}" stroke-width="14" stroke-dasharray="${sliceLength} ${circumference}" stroke-dashoffset="-${sliceLength * 2}"/>
      </svg>
      <div style="display:flex;gap:6px;margin-top:6px;justify-content:center;font-size:7px;color:#64748b">
        <span>● Read.</span>
        <span>● Value</span>
        <span>● Opp.</span>
      </div>
    </td>
  `;

  const roadmapSection = data.roadmap ? `
    <tr style="page-break-inside:avoid">
      <td style="padding:16px 0">
        <table border="0" cellpadding="0" cellspacing="0" style="width:100%">
          <tr>
            <td style="padding:16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px">
              <p style="margin:0 0 14px 0;font-size:10.5px;font-weight:900;text-transform:uppercase;letter-spacing:0.5px;color:#312e81">AI Roadmap & Phased Adoption</p>
              ${["phase1", "phase2", "phase3"].map(phase => `
                <div style="margin-bottom:14px">
                  <p style="margin:0 0 6px 0;font-size:9.5px;font-weight:800;color:#1e293b">${phase === "phase1" ? "Phase 1: Quick Wins (0 to 3 Months)" : phase === "phase2" ? "Phase 2: Strategic Expansion (3 to 6 Months)" : "Phase 3: Long-term Scale (6 to 12 Months)"} (${data.roadmap![phase as keyof typeof data.roadmap]!.length} items)</p>
                  <ul style="margin:0;padding-left:20px">
                    ${data.roadmap![phase as keyof typeof data.roadmap]!.map(item => `<li style="font-size:9px;color:#475569;margin-bottom:4px">${renderMarkdown(item)}</li>`).join("")}
                  </ul>
                </div>
              `).join("")}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  ` : "";

  const insightsHtml = data.insights && data.insights.length > 0 ? `
    <tr style="page-break-inside:avoid">
      <td style="padding:16px 0">
        <p style="margin:0 0 10px 0;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#94a3b8">Key Opportunities Insights</p>
        <table border="0" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse">
          ${data.insights.map((ins, i) => `
            <tr>
              <td style="padding:4px 0">
                <table border="0" cellpadding="0" cellspacing="0" style="width:100%;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px">
                  <tr>
                    <td style="padding:10px 12px">
                      <table border="0" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="vertical-align:top;padding-right:10px;width:20px">
                            <div style="width:20px;min-width:20px;font-size:12px;font-weight:800;color:#94a3b8;text-align:center">${i + 1}.</div>
                          </td>
                          <td style="vertical-align:top;font-size:11px;color:#334155">${renderMarkdown(ins)}</td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          `).join("")}
        </table>
      </td>
    </tr>
  ` : "";

  const recommendationsHtml = data.recommendations && data.recommendations.length > 0 ? `
    <tr style="page-break-inside:avoid">
      <td style="padding:16px 0">
        <table border="0" cellpadding="0" cellspacing="0" style="width:100%;background:#f0fdf4;border:1px solid #dcfce7;border-radius:10px">
          <tr>
            <td style="padding:12px 14px">
              <p style="margin:0 0 8px 0;font-size:10.5px;font-weight:900;color:#15803d;text-transform:uppercase;letter-spacing:0.5px">Core Recommendations (${data.recommendations.length})</p>
              <ul style="margin:0;padding-left:20px">
                ${data.recommendations.map(r => `<li style="font-size:9.5px;color:#475569;margin-bottom:4px">${renderMarkdown(r)}</li>`).join("")}
              </ul>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  ` : "";

  const auditReportHtml = data.auditReport ? `
    <tr style="page-break-inside:avoid">
      <td style="padding:16px 0">
        <table border="0" cellpadding="0" cellspacing="0" style="width:100%;background:#fafaf9;border:1px solid #f5f5f4;border-radius:10px">
          <tr>
            <td style="padding:16px 20px">
              <p style="margin:0 0 10px 0;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#94a3b8">Full Opportunities Analysis</p>
              <div style="font-size:10px;color:#475569;line-height:1.6;white-space:pre-wrap">${renderMarkdown(data.auditReport)}</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  ` : "";

  const logoBase64 = "data:image/jpeg;base64,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";

  const fullHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <title>${data.reportTitle}</title>
      <style>
        body { margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #0f172a; }
        .pdf-container { width: 720px; margin: 0 auto; background: #fff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.07); page-break-inside:avoid; }
        .header { display: flex; justify-content: space-between; align-items: center; padding: 10px 0 20px 0; border-bottom: 1px solid #e2e8f0; margin-bottom: 20px; }
        .footer { margin-top: 40px; padding-top: 10px; border-top: 1px solid #e2e8f0; font-size: 9px; color: #94a3b8; text-align: center; }
        ul { margin: 0; padding-left: 20px; }
        li { margin-bottom: 6px; }
      </style>
    </head>
    <body>
      <div class="pdf-container">
        <div style="height: 5px; background: linear-gradient(90deg, #4f46e5 0%, #6366f1 100%);"></div>
        <div style="padding: 32px;">
          <div class="header">
            <div style="display:flex;align-items:center;gap:12px">
              <img src="${logoBase64}" alt="Pixel Punch" style="height:28px;width:auto;object-contain:true" />
              <div style="height:20px;width:1px;background:#e2e8f0"></div>
              <div>
                <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#64748b">AI Opportunity Audit & Roadmap</div>
              </div>
            </div>
            <div style="text-align:right">
              <div style="font-size:10px;color:#64748b;margin-bottom:4px">Report Date: <strong style="color:#1e293b">${today}</strong></div>
              <div style="font-size:10px;color:#64748b;margin-bottom:8px">Ref: <strong style="color:#1e293b">#${reportId}</strong></div>
              <div style="display:inline-block;background:#e0e7ff;border:1px solid #bfdbfe;border-radius:999px;padding:2px 10px;font-size:9px;font-weight:700;color:#3730a3;text-transform:uppercase;letter-spacing:0.5px">Confidential</div>
            </div>
          </div>
          <div style="margin:0 0 24px 0">
            <h1 style="margin:0 0 8px 0;font-size:20px;font-weight:800;color:#0f172a;line-height:1.3">${data.reportTitle}</h1>
            ${data.companyName ? `<p style="margin:0;font-size:11px;color:#64748b">For: <strong style="color:#334155">${data.companyName}</strong></p>` : ""}
          </div>
          <table border="0" cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:24px">
            <tr style="page-break-inside:avoid">
              <td style="width:63%;vertical-align:top">
                <table border="0" cellpadding="0" cellspacing="0" style="width:100%">
                  <tr>
                    ${scorecardRows}
                  </tr>
                </table>
              </td>
              <td style="width:2%"></td>
              ${svgPieChart}
            </tr>
          </table>
          ${roadmapSection}
          ${insightsHtml}
          ${recommendationsHtml}
          ${auditReportHtml}
          <div class="footer">
            <p>This report was automatically compiled by <strong>Pixel Punch AI</strong>.<br>
            Report ID: ${reportId} | © 2026 Pixel Punch. All rights reserved.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  return fullHtml;
}

async function loadLogoBase64(): Promise<string> {
  try {
    const logoPath = path.join(process.cwd(), "public", "logo.jpg");
    if (fs.existsSync(logoPath)) {
      const logoData = fs.readFileSync(logoPath);
      return `data:image/jpeg;base64,${logoData.toString("base64")}`;
    }
  } catch (err) {
    console.warn("[pdf-generator] Could not load logo.jpg, using placeholder");
  }
  return "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wgARCAIyBQADASIAAhEBAxEB/8QAGwABAAIDAQEA";
}

export async function generatePdf(data: PdfReportData): Promise<Buffer> {
  const logoBase64 = await loadLogoBase64();
  
  // Determine executable path and args for chromium based on serverless vs local environment
  let executablePath = "";
  let launchArgs = ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"];
  
  if (process.env.NODE_ENV === "production" || process.env.VERCEL) {
    // Vercel serverless environment
    executablePath = await chromium.executablePath(
      "https://github.com/Sparticuz/chromium/releases/download/v123.0.1/chromium-v123.0.1-pack.tar"
    );
    launchArgs = [...chromium.args, "--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"];
  } else {
    // Local environment - locate chrome executable
    const os = require("os");
    if (os.platform() === "win32") {
      executablePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
    } else if (os.platform() === "darwin") {
      executablePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
    } else {
      executablePath = "/usr/bin/google-chrome";
    }
  }

  const browser = await puppeteer.launch({
    args: launchArgs,
    executablePath,
    headless: true,
  });

  try {
    const page = await browser.newPage();
    const html = data.reportType === "cost"
      ? buildCostAuditHtml(data, logoBase64)
      : buildOpportunityAuditHtml(data, logoBase64);

    await page.setContent(html, { waitUntil: "domcontentloaded" });

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "20mm", right: "20mm", bottom: "20mm", left: "20mm" },
    });

    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
