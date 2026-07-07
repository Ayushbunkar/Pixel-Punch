interface ReportItem {
  type: 'paragraph' | 'list' | 'image' | 'code';
  content: string;
}

interface ReportSection {
  id: string;
  title: string;
  subtext?: string;
  items: ReportItem[];
}

export interface ReportData {
  title: string;
  timestamp: string;
  metadata: { [key: string]: string };
  sections: ReportSection[];

  submissionId?: string;
  reportType?: "cost" | "opportunity";
  scorecard?: {
    dimensions: Array<{
      label: string;
      value: "red" | "amber" | "green" | "unknown";
      bgColor: string;
      textColor: string;
      borderColor: string;
      dotColor: string;
      labelColor: string;
    }>;
  };
  tier?: 1 | 2 | 3 | 4;
  confidenceScore?: string;
  logoBase64?: string;
}

// ── Brand Colors ─────────────────────────────────────────────────────────────
export const BRAND_COLORS = {
  primary: { bg: "#eff6ff", border: "#bfdbfe", text: "#1d4ed8" },
  accent:  { bg: "#f8fafc", border: "#e2e8f0", text: "#334155" },
  success: { bg: "#f0fdf4", border: "#bbf7d0", text: "#16a34a" },
  warning: { bg: "#fffbeb", border: "#fcd34d", text: "#d97706" },
  danger:  { bg: "#fff1f2", border: "#fca5a5", text: "#dc2626" },
};

export const RAG_COLORS = {
  red:   { bg: "#fee2e2", text: "#dc2626", border: "#fca5a5", dot: "#dc2626", label: "Action Needed"  },
  amber: { bg: "#fffbeb", text: "#d97706", border: "#fcd34d", dot: "#d97706", label: "Needs Attention" },
  green: { bg: "#f0fdf4", text: "#16a34a", border: "#86efac", dot: "#16a34a", label: "Looking Good"    },
};

export function getColorConfig(value: "red" | "amber" | "green" | "unknown") {
  const config = RAG_COLORS[value as keyof typeof RAG_COLORS];
  if (!config) return { bgColor: "#f8fafc", textColor: "#64748b", borderColor: "#e2e8f0", dotColor: "#94a3b8", labelColor: "Unknown" };
  return {
    bgColor: config.bg,
    textColor: config.text,
    borderColor: config.border,
    dotColor: config.dot,
    labelColor: config.label,
  };
}

// ── RAG helpers ───────────────────────────────────────────────────────────────
const ragColor  = (v: string) => v === "red" ? "#dc2626" : v === "amber" ? "#d97706" : v === "green" ? "#16a34a" : "#64748b";
const ragBg     = (v: string) => v === "red" ? "#fee2e2" : v === "amber" ? "#fef3c7" : v === "green" ? "#dcfce7" : "#f8fafc";
const ragText   = (v: string) => v === "red" ? "#991b1b" : v === "amber" ? "#b45309" : v === "green" ? "#166534" : "#64748b";
const ragBorder = (v: string) => v === "red" ? "#fca5a5" : v === "amber" ? "#fcd34d" : v === "green" ? "#86efac" : "#e2e8f0";
const ragLabel  = (v: string) => v === "red" ? "HIGH RISK" : v === "amber" ? "NEEDS ATTENTION" : v === "green" ? "✓ GOOD" : "UNKNOWN";
const ragFlag   = (v: string) => v === "red" ? "" : v === "amber" ? "" : v === "green" ? "" : "";

const TRANSPARENT_GIF_BASE64 = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

// ── Strip leading hyphens from titles ─────────────────────────────────────────
export function stripLeadingHyphens(text: string): string {
  return text.replace(/^-+\s*/, '');
}

// ── Markdown → HTML converter ─────────────────────────────────────────────────
export function mdToHtml(markdown: string, options: { pdfMode?: boolean; emailMode?: boolean } = {}): string {
  if (!markdown) return "";
  const { pdfMode = false } = options;

  const lines = markdown.split(/\r?\n/);
  const result: string[] = [];
  let inList = false;

  const closeList = () => { if (inList) { result.push("</ul>"); inList = false; } };

  const applyInline = (line: string) => {
    // Bold+italic ***text***
    line = line.replace(/\*\*\*(.*?)\*\*\*/g, '<strong style="font-weight:700;font-style:italic;color:#0f172a;">$1</strong>');
    // Bold **text**
    line = line.replace(/\*\*(.*?)\*\*/g, '<strong style="font-weight:700;color:#0f172a;">$1</strong>');
    // Italic *text*
    line = line.replace(/\*(.*?)\*/g, '<em style="font-style:italic;color:#334155;">$1</em>');
    // Bold __text__
    line = line.replace(/__(.*?)__/g, '<strong style="font-weight:700;color:#0f172a;">$1</strong>');
    // Italic _text_
    line = line.replace(/_(.*?)_/g, '<em style="font-style:italic;color:#334155;">$1</em>');
    // Code `text`
    line = line.replace(/`([^`]+)`/g, '<code style="background:#f1f5f9;padding:1px 4px;border-radius:3px;font-size:0.9em;color:#0f172a;">$1</code>');
    // Links [text](url)
    if (options.emailMode) {
      line = line.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color:#0d6efd;text-decoration:underline;">$1</a>');
    } else {
      line = line.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
    }
    return line;
  };

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const trimmed = raw.trim();

    // Headings
    if (/^### (.+)/.test(trimmed)) {
      closeList();
      const text = applyInline(trimmed.replace(/^### /, ""));
      result.push(`<h3 style="font-size:${pdfMode ? "11px" : "13px"};font-weight:700;color:#1e293b;margin:${pdfMode ? "12px 0 4px" : "18px 0 6px"};border-bottom:1px solid #f1f5f9;padding-bottom:4px;">${text}</h3>`);
    } else if (/^## (.+)/.test(trimmed)) {
      closeList();
      const text = applyInline(trimmed.replace(/^## /, ""));
      result.push(`<h2 style="font-size:${pdfMode ? "12px" : "15px"};font-weight:700;color:#0f172a;margin:${pdfMode ? "16px 0 6px" : "22px 0 8px"};border-bottom:2px solid #e2e8f0;padding-bottom:6px;">${text}</h2>`);
    } else if (/^# (.+)/.test(trimmed)) {
      closeList();
      const text = applyInline(trimmed.replace(/^# /, ""));
      result.push(`<h1 style="font-size:${pdfMode ? "14px" : "18px"};font-weight:800;color:#0f172a;margin:${pdfMode ? "20px 0 8px" : "28px 0 10px"};">${text}</h1>`);

    // Bullet / list items (-, *, +)
    } else if (/^[-*+] (.+)/.test(trimmed)) {
      const content = applyInline(trimmed.replace(/^[-*+] /, "").trim());
      if (!inList) {
        result.push('<ul style="list-style:none;padding:0;margin:8px 0;">');
        inList = true;
      }
      result.push(`<li style="font-size:${pdfMode ? "10px" : "12px"};color:#475569;line-height:1.7;margin-bottom:6px;padding-left:16px;position:relative;"><span style="position:absolute;left:0;color:#2563eb;font-weight:700;">•</span>${content}</li>`);

    // Numbered list items
    } else if (/^\d+\.\s/.test(trimmed)) {
      const content = applyInline(trimmed.replace(/^\d+\.\s/, "").trim());
      if (!inList) {
        result.push('<ul style="list-style:none;padding:0;margin:8px 0;">');
        inList = true;
      }
      const num = trimmed.match(/^(\d+)\./)?.[1] ?? "1";
      result.push(`<li style="font-size:${pdfMode ? "10px" : "12px"};color:#475569;line-height:1.7;margin-bottom:6px;padding-left:20px;position:relative;"><span style="position:absolute;left:0;color:#2563eb;font-weight:700;">${num}.</span>${content}</li>`);

    // Blockquotes
    } else if (/^> (.+)/.test(trimmed)) {
      closeList();
      const content = applyInline(trimmed.replace(/^> /, "").trim());
      result.push(`<blockquote style="margin:8px 0;padding:8px 14px;border-left:3px solid #bfdbfe;background:#eff6ff;border-radius:0 6px 6px 0;color:#1d4ed8;font-size:${pdfMode ? "10px" : "12px"};line-height:1.6;">${content}</blockquote>`);

    // Horizontal rule
    } else if (/^(---|\*\*\*|___)$/.test(trimmed)) {
      closeList();
      result.push('<hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0;">');

    // Empty line
    } else if (trimmed === "") {
      closeList();
      result.push('<div style="height:8px;"></div>');

    // Normal paragraph
    } else {
      closeList();
      const content = applyInline(trimmed);
      result.push(`<p style="font-size:${pdfMode ? "11px" : "13px"};color:#475569;line-height:1.75;margin:6px 0;">${content}</p>`);
    }
  }

  closeList();
  return result.join("\n");
}

// ── Scorecard HTML matching web UI cards ──────────────────────────────────────
function renderScorecardHtml(
  dimensions: NonNullable<ReportData["scorecard"]>["dimensions"],
  mode: "email" | "pdf" | "web",
  reportType: string
): string {
  const isCost = reportType === "cost";

  // Label mapping to match web UI dfsfds
  const labelMap: Record<string, string> = isCost
    ? { 0: "Spend & Visibility", 1: "Architecture Risk", 2: "Business Pain & Urgency" }
    : { 0: "Technical AI Readiness", 1: "Business Value Potential", 2: "Automation Opportunity" };

  // Sub-text descriptions for each card dimension (matching web UI)
  const subtextMap: Record<string, Record<string, string>> = {
    cost: {
      0: "Measures your cloud & AI spend efficiency and visibility gaps across providers.",
      1: "Evaluates architectural decisions that drive unnecessary cost or technical debt.",
      2: "Assesses operational pain, urgency, and business impact of current inefficiencies."
    },
    opportunity: {
      0: "Evaluates your data infrastructure, tooling, and team capability for AI adoption.",
      1: "Measures the ROI potential and strategic alignment of AI across your operations.",
      2: "Identifies how much workflow automation can realistically be implemented today."
    }
  };
  const subtextGroup = subtextMap[isCost ? "cost" : "opportunity"];

  const cardsHtml = dimensions.map((dim, idx) => {
    const val = dim.value;
    const displayLabel = labelMap[idx] ?? dim.label;
    const subtext = subtextGroup?.[idx] ?? "";
    const bg    = ragBg(val);
    const color = ragColor(val);
    const txt   = ragText(val);
    const bord  = ragBorder(val);
    const badge = ragLabel(val);
    const flag  = ragFlag(val);

    return `
    <td style="width:${Math.floor(100 / dimensions.length)}%;padding:0 6px;vertical-align:top;">
      <div style="background:${bg};border:1.5px solid ${bord};border-radius:12px;padding:16px 14px;box-sizing:border-box;">
        <div style="font-size:${mode === "pdf" ? "8px" : "10px"};font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:4px;">${displayLabel}</div>
        ${mode === "email" ? `
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin-bottom:6px;mso-table-lspace:0pt;mso-table-rspace:0pt;">
          <tr>
            <td style="font-size:14px;line-height:1;padding-right:6px;">${flag}</td>
            <td style="font-size:11px;font-weight:700;color:${color};">${badge}</td>
          </tr>
        </table>
        ` : `
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
          <span style="font-size:14px;line-height:1;">${flag}</span>
          <span style="font-size:${mode === "pdf" ? "10px" : "11px"};font-weight:700;color:${color};">${badge}</span>
        </div>
        `}

        <div style="font-size:${mode === "pdf" ? "22px" : "28px"};font-weight:900;color:${color};letter-spacing:-0.5px;line-height:1;margin-bottom:8px;">${val.toUpperCase()}</div>
        <div style="margin-bottom:10px;display:inline-block;background:${txt === "#991b1b" ? "#fef2f2" : txt === "#b45309" ? "#fffbeb" : "#f0fdf4"};border:1px solid ${bord};border-radius:4px;padding:2px 8px;">
          <span style="font-size:${mode === "pdf" ? "8px" : "9px"};font-weight:700;color:${txt};text-transform:uppercase;letter-spacing:0.5px;">${val.toUpperCase()}</span>
        </div>
        ${subtext ? `<div style="font-size:${mode === "pdf" ? "8px" : "10px"};color:#64748b;line-height:1.5;margin-top:8px;padding-top:8px;border-top:1px solid ${bord}80;">${subtext}</div>` : ""}
      </div>
    </td>`;
  }).join("");

  return `
  <div style="padding:24px 32px;background:linear-gradient(135deg,#f8fafc 0%,#eef2ff 100%);border-bottom:1px solid #e2e8f0;margin-bottom:24px;">
    <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#64748b;margin-bottom:16px;">
      RAG Scorecard Overview
    </div>
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:separate;border-spacing:8px 0;">
      <tr>
        ${cardsHtml}
      </tr>
    </table>
  </div>`;
}

// ── Main renderer ─────────────────────────────────────────────────────────────
export function renderReportToHtml(report: ReportData, options: { mode: "web" | "email" | "pdf"; locked?: boolean }): string {
  const { mode } = options;
  const isPdf = mode === "pdf";

  let bodyContent = "";

  if (mode === "email") {
    // Assuming report.submissionId is available to construct the URL
    // You might need to adjust this URL based on your actual application's routing
    const viewReportLink = `https://app.pixelpunch.org/reports/${report.submissionId || 'default-report-id'}`;

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Your Report is Ready</title>
  <style>
    body { margin:0; padding:0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; background:#f1f5f9; }
    p { margin:0; }
  </style>
</head>
</html>`;
  }


  // ── Header bar
  bodyContent += `
  <div style="background:#0d6efd;padding:10px 32px;">
    <!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td style="padding:0;width:50%;" valign="middle"><![endif]-->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="width:100%;table-layout:fixed;">
      <tr>
        <td style="padding:8px 0;width:50%;text-align:left;vertical-align:middle;background-color:#0d6efd;">
          <div style="padding-left:16px;">
          ${report.logoBase64
        ? `<img src="${report.logoBase64}" alt="Pixel Punch" style="height:32px;width:auto;object-fit:contain;">`
        : `<span style="font-size:20px;font-weight:900;color:#fff;letter-spacing:-0.5px;">Pixel Punch</span>`
      }
          </div>
        </td>
        <td style="padding:0;width:50%;text-align:right;vertical-align:middle;">
          <span style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:rgba(255,255,255,0.85);">${report.reportType === "cost" ? "AI Cost Audit Report" : "AI Opportunity Audit Report"}</span>
        </td>
      </tr>
    </table>
    <!--[if mso | IE]></td></tr></table><![endif]-->
  </div>`;

  // ── Title block
  bodyContent += `
  <div style="padding:28px 32px 20px;text-align:center;background:#fff;border-bottom:1px solid #e2e8f0;">
    <h1 style="font-size:${isPdf ? "24px" : "28px"};font-weight:800;color:#0f172a;margin:0 0 6px;line-height:1.2;">${stripLeadingHyphens(report.title)}</h1>
    <p style="font-size:12px;color:#64748b;margin:0 0 12px;">Generated: ${report.timestamp}</p>
    <div style="display:inline-flex;flex-wrap:wrap;gap:12px;justify-content:center;background:#f8fafc;border-radius:8px;padding:10px 20px;border:1px solid #e2e8f0;">
      ${Object.keys(report.metadata).map(key =>
        `<span style="font-size:11px;color:#475569;"><strong style="color:#0f172a;">${key}:</strong> ${report.metadata[key]}</span>`
      ).join('<span style="color:#cbd5e1;font-size:11px;">|</span>')}
    </div>

  </div>`;

  // ── Scorecard Section
  if (report.scorecard?.dimensions?.length) {
    bodyContent += renderScorecardHtml(report.scorecard.dimensions, mode, report.reportType ?? "cost");
  }

  // ── Confidence Score
  if (report.confidenceScore) {
    const score = Number(report.confidenceScore.replace("%", ""));
    const depth = score >= 70 ? "High Data Depth" : score >= 40 ? "Medium Data Depth" : "Low Data Depth";
    bodyContent += `
    <div style="padding:20px 32px;margin-bottom:24px;border-bottom:1px solid #e2e8f0;">
      <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#64748b;margin-bottom:12px;">Audit Confidence Score</div>
      ${isPdf ? `
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;">
        <tr>
          <td style="padding-right:20px;">
            <div style="text-align:center;background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:14px 24px;">
              <div style="font-size:36px;font-weight:900;color:#2563eb;line-height:1;">${report.confidenceScore}</div>
              <div style="font-size:9px;text-transform:uppercase;font-weight:700;color:#2563eb;margin-top:4px;">${depth}</div>
            </div>
          </td>
        </tr>
      </table>
      ` : `
      <div style="display:flex;align-items:center;gap:20px;flex-wrap:wrap;">`}

        <div style="text-align:center;background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:14px 24px;">
          <div style="font-size:${isPdf ? "28px" : "36px"};font-weight:900;color:#2563eb;line-height:1;">${report.confidenceScore}</div>
          <div style="font-size:9px;text-transform:uppercase;font-weight:700;color:#2563eb;margin-top:4px;">${depth}</div>
        </div>
      </div>
    </div>`;
  }

  // ── Section rendering helpers
  const sectionOrder = ["insights", "findings", "recommendations", "auditReport", "roadmap"];
  const sectionsMap = new Map<string, ReportSection>();
  report.sections.forEach(s => sectionsMap.set(s.id, s));

  let findingsHtml = "";
  let recsHtml = "";

  sectionOrder.forEach(sectionId => {
    const section = sectionsMap.get(sectionId);
    if (!section) return;

    if (sectionId === "insights") {
      const items = section.items.flatMap(item =>
        item.content.split("\n").map(l => l.replace(/^[-*+]\s*/, "").trim()).filter(Boolean)
      );
      bodyContent += `
      <div style="padding:20px 32px;margin-bottom:24px;border-bottom:1px solid #e2e8f0;">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#64748b;margin-bottom:14px;">💡 Key Insights</div>
      <div style="display:flex;flex-direction:column;gap:10px;">

          ${items.map(text => `
            <div style="display:flex;gap:12px;align-items:flex-start;padding:10px 14px;background:#eff6ff;border-radius:8px;border:1px solid #bfdbfe;">
              <span style="color:#2563eb;font-size:14px;margin-top:1px;flex-shrink:0;">✓</span>
              <p style="font-size:${isPdf ? "11px" : "13px"};color:#1e3a8a;line-height:1.6;margin:0;">${text}</p>
            </div>`
          ).join("")}
        </div>
      </div>`;

    } else if (sectionId === "findings") {
      const items = section.items.flatMap(item =>
        item.content.split("\n").map(l => l.replace(/^[-*+]\s*/, "").trim()).filter(Boolean)
      );
      findingsHtml = `
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#dc2626;margin-bottom:12px;">⚠ Key Findings</div>
        <div style="display:flex;flex-direction:column;gap:8px;">
          ${items.map(text => `
            <div style="display:flex;gap:10px;align-items:flex-start;padding:8px 0;border-bottom:1px solid #fee2f2;">
              <span style="color:#dc2626;font-weight:700;flex-shrink:0;margin-top:2px;">•</span>
              <p style="font-size:${isPdf ? "10px" : "12px"};color:#475569;line-height:1.6;margin:0;">${text}</p>
            </div>`
          ).join("")}
        </div>`;

    } else if (sectionId === "recommendations") {
      const items = section.items.flatMap(item =>
        item.content.split("\n").map(l => l.replace(/^[-*+]\s*/, "").trim()).filter(Boolean)
      );
      recsHtml = `
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#16a34a;margin-bottom:12px;">✓ Expert Recommendations</div>
        <div style="display:flex;flex-direction:column;gap:8px;">
          ${items.map(text => `
            <div style="display:flex;gap:10px;align-items:flex-start;padding:8px 0;border-bottom:1px solid #dcfce7;">
              <span style="color:#16a34a;font-weight:700;flex-shrink:0;margin-top:2px;">•</span>
              <p style="font-size:${isPdf ? "10px" : "12px"};color:#475569;line-height:1.6;margin:0;">${text}</p>
            </div>`
          ).join("")}
        </div>`;

    } else if (sectionId === "auditReport") {
      const rawContent = section.items[0]?.content ?? "";
      bodyContent += `
      <div style="padding:20px 32px;margin-bottom:24px;border-bottom:1px solid #e2e8f0;">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#64748b;margin-bottom:14px;">📋 Full Technical Audit</div>
        <div style="background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;padding:20px;">
          ${mdToHtml(rawContent, { pdfMode: isPdf, emailMode: false })}
        </div>
      </div>`;

    } else if (sectionId === "roadmap") {
      bodyContent += `
      <div style="padding:20px 32px;margin-bottom:24px;border-bottom:1px solid #e2e8f0;">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#64748b;margin-bottom:14px;">🗺 AI Roadmap & Phased Adoption</div>
      <div style="display:flex;flex-direction:column;gap:16px;">
          ${section.items.map(item => {
            if (item.type === "paragraph") {
              return `<div style="font-size:${isPdf ? "11px" : "13px"};font-weight:700;color:#1e293b;padding:8px 0;border-bottom:2px solid #e2e8f0;">${item.content}</div>`;
            }
            const listItems = item.content
              .split("\n")
              .map(l => l.replace(/^[-*+\d.]+\s*/, "").trim())
              .filter(Boolean);
            return `<div style="display:flex;flex-direction:column;gap:8px;">
              ${listItems.map(text => `
                <div style="display:flex;gap:10px;align-items:flex-start;padding:8px 12px;background:#f8fafc;border-radius:8px;border-left:3px solid #0d6efd;">
                  <span style="color:#0d6efd;font-weight:700;flex-shrink:0;">→</span>
                  <p style="font-size:${isPdf ? "10px" : "12px"};color:#475569;line-height:1.6;margin:0;">${text}</p>
                </div>`
              ).join("")}
            </div>`;
          }).join("")}
      </div>

      </div>`;
    }
  });

  // ── Combined findings + recommendations block
  if (findingsHtml || recsHtml) {
    bodyContent += `
    <div style="padding:20px 32px;margin-bottom:24px;border-bottom:1px solid #e2e8f0;">
      <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#64748b;margin-bottom:16px;">Analysis Summary</div>
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout:fixed;height:100%;border-collapse:separate;border-spacing:16px 0;margin:0 -16px;mso-table-lspace:0pt;mso-table-rspace:0pt;">
        <tr style="vertical-align:stretch;">
          ${findingsHtml && recsHtml ? `
            <td style="width:50%;vertical-align:stretch;padding:0 8px 0 0;height:100%;">
              <div style="background:#fff;border-radius:10px;border:1px solid #fca5a5;padding:16px;height:100%;box-sizing:border-box;">
                ${findingsHtml}
              </div>
            </td>
            <td style="width:50%;vertical-align:stretch;padding:0 0 0 8px;height:100%;">
              <div style="background:#fff;border-radius:10px;border:1px solid #86efac;padding:16px;height:100%;box-sizing:border-box;">
                ${recsHtml}
              </div>
            </td>
          ` : findingsHtml ? `
            <td style="width:100%;vertical-align:top;height:100%;">
              <div style="background:#fff;border-radius:10px;border:1px solid #fca5a5;padding:16px;height:100%;box-sizing:border-box;">
                ${findingsHtml}
              </div>
            </td>
          ` : `
            <td style="width:100%;vertical-align:top;height:100%;">
              <div style="background:#fff;border-radius:10px;border:1px solid #86efac;padding:16px;height:100%;box-sizing:border-box;">
                ${recsHtml}
              </div>
            </td>
          `}
        </tr>
      </table>
    </div>`;
  }

  // ── Footer
  const footer = `
  <div style="padding:20px 32px;background:#0f172a;text-align:center;">
    <p style="color:rgba(255,255,255,0.5);font-size:10px;margin:0;">
      Generated by Pixel Punch AI · pixelpunch.org · © 2026 Pixel Punch. Confidential & Proprietary.
    </p>
  </div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>${report.title} — Pixel Punch</title>
  <style>
    body { margin:0; padding:0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; background:#f1f5f9; }
    p { margin:0; }
    ul { margin:0; padding:0; list-style:none; }
  </style>
</head>
<body>
  <div style="max-width:860px;margin:0 auto;background:#ffffff;border-radius:0;overflow:hidden;">
    ${bodyContent}
    ${footer}
  </div>
</body>
</html>`;
}
