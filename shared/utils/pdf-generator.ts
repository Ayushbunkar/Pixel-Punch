import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium-min";

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
  return text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\*(.*?)\*/g, "<em>$1</em>");
}

// ── Build PDF HTML for Cost Audit ────────────────────────────────────────────────────
function buildCostAuditHtml(data: PdfReportData): string {
  const tier = data.tier || 4;
  const tierStyles = getTierStyles(tier);
  const today = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
  const reportId = data.submissionId.slice(0, 8).toUpperCase();

  const scorecardRows = data.scorecard.dimensions.map(dim => `
    <td style="padding:12px 16px;background:${dim.bgColor};border:1px solid ${dim.borderColor};border-radius:8px;width:32%">
      <p style="margin:0 0 6px 0;font-size:10px;font-weight:700;color:${dim.textColor};text-transform:uppercase;letter-spacing:0.4px">${dim.label}</p>
      <div style="display:flex;align-items:center;gap:6px">
        <div style="width:8px;height:8px;border-radius:50%;background:${dim.dotColor}"></div>
        <span style="font-size:12px;font-weight:700;color:${dim.textColor}">${dim.labelColor}</span>
      </div>
      <p style="margin:4px 0 0 0;font-size:9px;color:${dim.textColor}">${dim.value?.toUpperCase()}</p>
    </td>
  `).join("<td style='width:2%'></td>");

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
    <td style="width:35%;padding:16px;background:#ffffff;border-radius:12px;border:1px solid #e2e8f0;text-align:center;vertical-align:middle">
      <svg width="100" height="100" viewBox="0 0 100 100" style="transform:rotate(-90deg);margin:0 auto;display:block">
        <circle cx="50" cy="50" r="35" fill="none" stroke="#f1f5f9" stroke-width="14"/>
        <circle cx="50" cy="50" r="35" fill="none" stroke="${costData[0].color}" stroke-width="14" stroke-dasharray="${sliceLength} ${circumference}" stroke-dashoffset="0"/>
        <circle cx="50" cy="50" r="35" fill="none" stroke="${costData[1].color}" stroke-width="14" stroke-dasharray="${sliceLength} ${circumference}" stroke-dashoffset="-${sliceLength}"/>
        <circle cx="50" cy="50" r="35" fill="none" stroke="${costData[2].color}" stroke-width="14" stroke-dasharray="${sliceLength} ${circumference}" stroke-dashoffset="-${sliceLength * 2}"/>
      </svg>
      <div style="display:flex;gap:6px;margin-top:10px;justify-content:center;font-size:8px;color:#64748b">
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

  const logoBase64 = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAx";

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

  const scorecardRows = data.scorecard.dimensions.map(dim => `
    <td style="padding:12px 16px;background:${dim.bgColor};border:1px solid ${dim.borderColor};border-radius:8px;width:32%">
      <p style="margin:0 0 6px 0;font-size:10px;font-weight:700;color:${dim.textColor};text-transform:uppercase;letter-spacing:0.4px">${dim.label}</p>
      <div style="display:flex;align-items:center;gap:6px">
        <div style="width:8px;height:8px;border-radius:50%;background:${dim.dotColor}"></div>
        <span style="font-size:12px;font-weight:700;color:${dim.textColor}">${dim.labelColor}</span>
      </div>
      <p style="margin:4px 0 0 0;font-size:9px;color:${dim.textColor}">${dim.value?.toUpperCase()}</p>
    </td>
  `).join("<td style='width:2%'></td>");

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
    <td style="width:35%;padding:16px;background:#ffffff;border-radius:12px;border:1px solid #e2e8f0;text-align:center;vertical-align:middle">
      <svg width="100" height="100" viewBox="0 0 100 100" style="transform:rotate(-90deg);margin:0 auto;display:block">
        <circle cx="50" cy="50" r="35" fill="none" stroke="#f1f5f9" stroke-width="14"/>
        <circle cx="50" cy="50" r="35" fill="none" stroke="${oppData[0].color}" stroke-width="14" stroke-dasharray="${sliceLength} ${circumference}" stroke-dashoffset="0"/>
        <circle cx="50" cy="50" r="35" fill="none" stroke="${oppData[1].color}" stroke-width="14" stroke-dasharray="${sliceLength} ${circumference}" stroke-dashoffset="-${sliceLength}"/>
        <circle cx="50" cy="50" r="35" fill="none" stroke="${oppData[2].color}" stroke-width="14" stroke-dasharray="${sliceLength} ${circumference}" stroke-dashoffset="-${sliceLength * 2}"/>
      </svg>
      <div style="display:flex;gap:6px;margin-top:10px;justify-content:center;font-size:8px;color:#64748b">
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

  const logoBase64 = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAx";

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

export async function generatePdf(data: PdfReportData): Promise<Buffer> {
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
      ? buildCostAuditHtml(data)
      : buildOpportunityAuditHtml(data);

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
