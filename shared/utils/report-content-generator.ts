interface ReportItem {
  type: 'paragraph' | 'list' | 'image' | 'code';
  content: string;
  // Add more properties as needed for different item types (e.g., src for image, language for code)
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

  // Fields moved from PdfReportData for unified model
  submissionId?: string;
  reportType?: "cost" | "opportunity";
  scorecard?: {
    dimensions: Array<{
      label: string; // e.g., "Spend"
      value: "red" | "amber" | "green" | "unknown"; // e.g., "red"
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

// ── Unified Brand Colors & Typography ───────────────────────────────────────────
export const BRAND_COLORS = {
  primary: { bg: "#eff6ff", border: "#bfdbfe", text: "#1d4ed8" },
  accent: { bg: "#f8fafc", border: "#e2e8f0", text: "#334155" },
  success: { bg: "#f0fdf4", border: "#bbf7d0", text: "#16a34a" },
  warning: { bg: "#fffbeb", border: "#fcd34d", text: "#d97706" },
  danger: { bg: "#fff1f2", border: "#fca5a5", text: "#dc2626" },
};

export const TYPOGRAPHY = {
  h1: { fontSize: "20px", fontWeight: "800", color: "#0f172a", marginBottom: "16px" },
  h2: { fontSize: "15px", fontWeight: "700", color: "#1e293b", marginBottom: "12px", borderBottom: "1px solid #e2e8f0", paddingBottom: "4px" },
  h3: { fontSize: "13px", fontWeight: "700", color: "#334155", marginBottom: "8px" },
  h4: { fontSize: "11px", fontWeight: "700", color: "#64748b", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" },
  body: { fontSize: "14px", color: "#475569", lineHeight: "1.6" },
  small: { fontSize: "10px", color: "#94a3b8" },
};

export const RAG_COLORS = {
  red:   { bg: "#fee2e2",  text: "#dc2626",  border: "#fca5a5", dot: "#dc2626",  label: "Action Needed" },
  amber: { bg: "#fffbeb",  text: "#d97706",  border: "#fcd34d", dot: "#d97706",  label: "Needs Attention" },
  green: { bg: "#f0fdf4",  text: "#16a34a",  border: "#86efac", dot: "#16a34a",  label: "Looking Good" },
};

export function getColorConfig(value: "red" | "amber" | "green" | "unknown") {
  const config = RAG_COLORS[value as keyof typeof RAG_COLORS];
  if (!config) return { bg: "#f8fafc", text: "#64748b", border: "#e2e8f0", dot: "#94a3b8", label: "Unknown" };
  return {
    bgColor: config.bg,
    textColor: config.text,
    borderColor: config.border,
    dotColor: config.dot,
    labelColor: config.label,
  };
}

// ── Markdown to HTML conversion ────────────────────────────────────────────
export function mdToHtml(markdown: string, options: { pdfMode?: boolean; emailMode?: boolean } = {}): string {
  if (!markdown) return "";

  const { pdfMode = false, emailMode = false } = options;
  
  const lines = markdown.split(/\r?\n/);
  const result: string[] = [];
  let inList = false;

  const getListItemStyle = () => {
    if (pdfMode) return 'style="margin-bottom:4px;color:#475569;font-size:9.5px;line-height:1.5"';
    if (emailMode) return 'style="margin-bottom:8px;font-size:14px;color:#475569;line-height:1.6"';
    return 'style="margin-bottom:5px;color:#475569;font-size:14px;line-height:1.6"';
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Headings
    if (/^### (.+)/.test(line)) {
      if (inList) { result.push("</ul>"); inList = false; }
      result.push(`<h3 style="color:#312e81;font-size:${pdfMode ? "12px" : "15px"};margin:${pdfMode ? "16px 0 6px 0" : "20px 0 6px 0"};font-weight:700;">${line.replace(/^### /, "")}</h3>`);
    } else if (/^## (.+)/.test(line)) {
      if (inList) { result.push("</ul>"); inList = false; }
      result.push(`<h2 style="color:#1e293b;font-size:${pdfMode ? "14px" : "18px"};margin:${pdfMode ? "20px 0 8px 0" : "24px 0 8px 0"};font-weight:700;border-bottom:1px solid #e2e8f0;padding-bottom:${pdfMode ? "4px" : "6px"};">${line.replace(/^## /, "")}</h2>`);
    } else if (/^# (.+)/.test(line)) {
      if (inList) { result.push("</ul>"); inList = false; }
      result.push(`<h1 style="color:#0f172a;font-size:${pdfMode ? "16px" : "22px"};margin:${pdfMode ? "24px 0 10px 0" : "28px 0 10px 0"};font-weight:800;">${line.replace(/^# /, "")}</h1>`);
    // Bullets
    } else if (/^[\*\-] (.+)/.test(line)) {
      if (!inList) { result.push('<ul style="margin:8px 0 8px 0;padding-left:20px;">'); inList = true; }
      const content = line.replace(/^[\*\-] /, "").replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\*(.*?)\*/g, "<em>$1</em>");
      result.push(`<li ${getListItemStyle()}>${content}</li>`);
    // Empty line
    } else if (line.trim() === "") {
      if (inList) { result.push("</ul>"); inList = false; }
      result.push('<br style="line-height:0;display:block;margin:4px 0;">');
    // Normal paragraph
    } else {
      if (inList) { result.push("</ul>"); inList = false; }
      const content = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\*(.*?)\*/g, "<em>$1</em>");
      result.push(`<p style="margin:6px 0;font-size:${pdfMode ? "11px" : "14px"};line-height:1.7;color:#475569;">${content}</p>`);
    }
  }

  if (inList) result.push("</ul>");
  return result.join("\n");
}

export function renderReportToHtml(report: ReportData, options: { mode: 'web' | 'email' | 'pdf', locked?: boolean }): string {
  const { mode, locked } = options;

  // Base styles for email and PDF compatibility
  const baseStyles = `
    body { margin: 0; padding: 0; font-family: system-ui, -apple-system, sans-serif; }
    div { box-sizing: border-box; }
    p { margin: 0; }
    ul { margin: 0; padding: 0; list-style: none; }
  `;

  let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${report.title} — Pixel Punch</title>
  <style>
    ${baseStyles}
  </style>
</head>
<body>
  <div style="max-width:900px;margin:0 auto;padding:32px 16px;">
`;

  // Brand Header for Email/PDF
  if (mode === 'email' || mode === 'pdf') {
    html += `<div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
              ${report.logoBase64 ? `<img src="${report.logoBase64}" alt="Company Logo" style="height: 40px; margin-right: 10px; vertical-align: middle;">` : ``}
              <span style="font-size: 24px; font-weight: bold; color: #0f172a;">PixelPunch Reports</span>
            </div>`;
  }

  // Main Title
  html += `<h1 style="color:#0f172a;font-size:${mode === 'pdf' ? "16px" : "22px"};margin:${mode === 'pdf' ? "24px 0 10px 0" : "28px 0 10px 0"};font-weight:800;">${report.title}</h1>`;

  // Timestamp and Metadata
  html += `<p style="font-size:${mode === 'pdf' ? "10px" : "12px"};color:#64748b;margin-bottom:20px;">Generated: ${report.timestamp}</p>`;
  for (const key in report.metadata) {
    html += `<p style="font-size:${mode === 'pdf' ? "10px" : "12px"};color:#64748b;margin-bottom:5px;"><strong>${key}:</strong> ${report.metadata[key]}</p>`;
  }
  html += `<br>`;

  // Scorecard Section (moved from send-report/route.ts)
  if (report.scorecard && report.scorecard.dimensions && report.scorecard.dimensions.length > 0) {
    const ragBadge = (label: string, value: "red" | "amber" | "green" | "unknown", colorConfig: any) => `
      <td style="width:33%;padding:12px 16px;background:${colorConfig.bg};border-radius:8px;border:1px solid ${colorConfig.border};">
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">${label}</div>
        <div style="font-size:13px;font-weight:600;color:#0f172a;">${colorConfig.label}</div>
      </td>
    `;
    
    const scorecardHtml = `
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
        <tr>
          ${report.scorecard.dimensions.map(dim => ragBadge(dim.label, dim.value, (RAG_COLORS as any)[dim.value])).join('')}
        </tr>
      </table>`;

    html += `
      <div style="background:#f8fafc;border-radius:12px;padding:20px;border:1px solid #e2e8f0;margin-bottom:24px">
        <p style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#94a3b8;margin:0 0 16px 0">📊 RAG Scorecard Overview</p>
        ${scorecardHtml}
      </div>`;
  }

  // Sections (Findings, Recommendations, Audit Report, Roadmap, etc.)
  report.sections.forEach(section => {
    html += `<h2 style="color:#1e293b;font-size:${mode === 'pdf' ? "14px" : "18px"};margin:${mode === 'pdf' ? "20px 0 8px 0" : "24px 0 8px 0"};font-weight:700;border-bottom:1px solid #e2e8f0;padding-bottom:${mode === 'pdf' ? "4px" : "6px"};">${section.title}</h2>`;
    if (section.subtext) {
      html += `<p style="font-size:${mode === 'pdf' ? "11px" : "14px"};color:#64748b;margin-bottom:15px;">${section.subtext}</p>`;
    }

    section.items.forEach(item => {
      let itemHtml = '';
      const markdownOptions = { pdfMode: mode === 'pdf', emailMode: mode === 'email' };

      // Handle markdown content for paragraphs (and potentially other types if they contain markdown)
      if (item.type === 'paragraph' && (item.content.includes('*') || item.content.includes('#') || item.content.includes('-'))) { // Simple check for potential markdown
          itemHtml = mdToHtml(item.content, markdownOptions);
      } else {
          switch (item.type) {
            case 'paragraph':
              itemHtml = `<p style="margin:6px 0;font-size:${mode === 'pdf' ? "11px" : "14px"};line-height:1.7;color:#475569;">${item.content}</p>`;
              break;
            case 'list':
              // Assuming list content is already line-break separated for mdToHtml handling
              itemHtml = mdToHtml(item.content, markdownOptions); // Let mdToHtml handle list formatting
              break;
            case 'code': // Handle code blocks
              itemHtml = `<pre style="background-color:#f4f4f4;padding:10px;border-radius:5px;overflow-x:auto;font-size:${mode === 'pdf' ? "10px" : "12px"};color:#333;"><code>${item.content}</code></pre>`;
              break;
            case 'image': // Handle images
              itemHtml = `<img src="${item.content}" alt="" style="max-width:100%;height:auto;display:block;margin:10px 0;">`;
              break;
            default:
              itemHtml = `<p style="margin:6px 0;font-size:${mode === 'pdf' ? "11px" : "14px"};line-height:1.7;color:#475569;">${item.content}</p>`;
          }
      }

      if (locked && item.type === 'paragraph') {
        itemHtml = itemHtml.replace(/<p(.*?)>(.*?)<\/p>/, `<p$1 style="filter: blur(3px); user-select: none; pointer-events: none;">$2</p>`);
      }
      html += itemHtml;
    });
  });

  html += `
  </div>
</body>
</html>`;

  return html;
}
