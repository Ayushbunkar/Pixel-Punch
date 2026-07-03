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

export const RAG_COLORS = {
  red:   { bg: "#fee2e2",  text: "#dc2626",  border: "#fca5a5", dot: "#dc2626",  label: "Action Needed" },
  amber: { bg: "#fffbeb",  text: "#d97706",  border: "#fcd34d", dot: "#d97706",  label: "Needs Attention" },
  green: { bg: "#f0fdf4",  text: "#16a34a",  border: "#86efac", dot: "#16a34a",  label: "Looking Good" },
};

export function getColorConfig(value: "red" | "amber" | "green" | "unknown") {
  const config = RAG_COLORS[value as keyof typeof RAG_COLORS]; // Correctly use RAG_COLORS
  if (!config) return { bg: "#f8fafc", text: "#64748b", border: "#e2e8f0", dot: "#94a3b8", label: "Unknown" };
  return {
    bgColor: config.bg,
    textColor: config.text,
    borderColor: config.border,
    dotColor: config.dot, // Correctly use config.dot
    labelColor: config.label, // Correctly use config.label
  };
}

// Helper functions to match ResultsPageContent.tsx RAG colors and labels
const ragColor = (v: string) => v === "red" ? "#dc2626" : v === "amber" ? "#d97706" : "#16a34a";
const ragLabel = (v: string) => v === "red" ? "⚠ HIGH RISK" : v === "amber" ? "◑ NEEDS ATTENTION" : "✓ GOOD";
const ragBg = (v: string) => v === "red" ? "#fee2e2" : v === "amber" ? "#fef3c7" : "#dcfce7";
const ragText = (v: string) => v === "red" ? "#991b1b" : v === "amber" ? "#b45309" : "#166534";

// Generate SVG Pie Chart for RAG Scorecard ratings
const generatePieChart = (data: { label: string; value: string; color: string }[]) => {
  const size = 100;
  const radius = 35;
  const cx = 50;
  const cy = 50;
  const circumference = 2 * Math.PI * radius; // ~219.91
  const sliceLength = circumference / 3;

  return `
  <div style="text-align: center; padding: 4px 0;">
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="transform: rotate(-90deg); margin: 0 auto; display: block;">
      <circle cx="${cx}" cy="${cy}" r="${radius}" fill="none" stroke="#f1f5f9" stroke-width="14"/>
      <circle cx="${cx}" cy="${cy}" r="${radius}" fill="none" stroke="${data[0].color}" stroke-width="14" stroke-dasharray="${sliceLength} ${circumference}" stroke-dashoffset="0"/>
      <circle cx="${cx}" cy="${cy}" r="${radius}" fill="none" stroke="${data[1].color}" stroke-width="14" stroke-dasharray="${sliceLength} ${circumference}" stroke-dashoffset="-${sliceLength}"/>
      <circle cx="${cx}" cy="${cy}" r="${radius}" fill="none" stroke="${data[2].color}" stroke-width="14" stroke-dasharray="${sliceLength} ${circumference}" stroke-dashoffset="-${sliceLength * 2}"/>
    </svg>
  </div>`;
};

// ── Markdown to HTML conversion ────────────────────────────────────────────
export function stripLeadingHyphens(text: string): string {
  return text.replace(/^-+\s*/, '');
}

export function mdToHtml(markdown: string, options: { pdfMode?: boolean; emailMode?: boolean } = {}): string {
  if (!markdown) return "";

  const { pdfMode = false, emailMode = false } = options;
  
  const lines = markdown.split(/\r?\n/);
  const result: string[] = [];
  let inList = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Handle inline formatting: bold, italics, links
    // Order matters: longer patterns first
    line = line.replace(/\*\*(.*?)\*\*/g, '<strong style="color: #020617; font-weight: 700;">$1</strong>'); // Bold
    line = line.replace(/\*(.*?)\*/g, '<em style="color: #334155; font-style: italic;">$1</em>');       // Italics (also handles _italics_)
    line = line.replace(/__(.*?)__/g, '<strong style="color: #020617; font-weight: 700;">$1</strong>'); // Bold
    line = line.replace(/_(.*?)_/g, '<em style="color: #334155; font-style: italic;">$1</em>');       // Italics
    line = line.replace(/<([^>]+)>/g, '$1'); // Strip HTML tags for simplicity
    line = line.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'); // Links: [text](url) -> text (strip URL)

    // Headings (match Web UI and hierarchical progression)
    if (/^### (.+)/.test(line)) {
      if (inList) { result.push("</ul>"); inList = false; }
      result.push(`<h3 style="font-size: ${pdfMode ? "10px" : "12px"}; font-weight: 700; color: #334155; margin: ${pdfMode ? "12px 0 4px 0" : "16px 0 4px 0"}; page-break-after: avoid;">${line.replace(/^### /, "")}</h3>`);
    } else if (/^## (.+)/.test(line)) {
      if (inList) { result.push("</ul>"); inList = false; }
      result.push(`<h2 style="font-size: ${pdfMode ? "11px" : "14px"}; font-weight: 700; color: #1e293b; margin: ${pdfMode ? "16px 0 6px 0" : "20px 0 6px 0"}; page-break-after: avoid;">${line.replace(/^## /, "")}</h2>`);
    } else if (/^# (.+)/.test(line)) {
      if (inList) { result.push("</ul>"); inList = false; }
      result.push(`<h1 style="font-size: ${pdfMode ? "12px" : "15px"}; font-weight: 700; color: #0f172a; margin: ${pdfMode ? "20px 0 8px 0" : "24px 0 8px 0"}; page-break-after: avoid;">${line.replace(/^# /, "")}</h1>`);
    // Lists (only '*' is recognized now, custom bullet for consistency)
    } else if (/^(\*|\-|\+) (.+)/.test(line)) { // Support *, -, + for markdown lists
        const listItemContent = line.replace(/^(\*|\-|\+) /, "").trim(); // Get content after bullet
        if (!inList) { result.push('<ul style="list-style: none; padding: 0; margin: 8px 0 8px 0; page-break-inside: avoid;">'); inList = true; } // Removed padding-left for custom bullet
        result.push(`<li style="font-size: ${pdfMode ? "10px" : "12px"}; color: #475569; line-height: 1.6; margin-bottom: 4px; padding-left: 15px; text-indent: -15px;">&bull; ${listItemContent}</li>`); // Added custom bullet and indent
    // Blockquotes (strip the '>' marker as per Web UI's cleanMarkdownForPdf)
    } else if (/^> (.+)/.test(line)) {
        const quoteContent = line.replace(/^> /, "").trim();
        result.push(`<blockquote style="margin: 0; padding: 8px 15px; border-left: 3px solid #cbd5e1; color: #64748b; font-size: ${pdfMode ? "11px" : "12px"}; line-height: 1.6; background-color: #f8fafc; border-radius: 4px; page-break-inside: avoid;">${quoteContent}</blockquote>`);
    // Code blocks (fenced ``` or indented code - strip them for visual consistency with Web UI)
    } else if (line.trim().startsWith("```") || line.startsWith("    ")) { // Basic detection for fenced or indented code
        // Strip code block markers/indentation and treat as paragraph for simplicity matching Web UI behavior
        line = line.replace(/^`{3,}\S*\s*|\s{4}/g, '').trim(); // Remove fence or 4-space indent
        if (line) { // Only add if there's content after stripping
            if (inList) { result.push("</ul>"); inList = false; }
            result.push(`<p style="margin:6px 0;font-size:${pdfMode ? "10px" : "11px"};line-height:1.6;color:#334155; font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace; background-color: #f4f4f4; padding: 4px 8px; border-radius: 4px; overflow-x: auto; page-break-inside: avoid;">${line}</p>`);
        }
    // Tables (very basic support, assume pipe-delimited, just render as paragraphs for simplicity)
    } else if (line.includes('|') && !line.includes('---')) { // Simple check for table rows, avoid separator line
        // Treat as plain text, possibly bolding header if detected
        const cells = line.split('|').map(cell => cell.trim()).filter(cell => cell !== '');
        if (cells.length > 0) {
            if (inList) { result.push("</ul>"); inList = false; }
            // Heuristic: if it looks like a header (all bold or first row), make cells bold
            if (i > 0 && lines[i-1].includes('---') && lines[i-1].includes('|')) { // Previous line was a separator
                result.push(`<p style="margin:4px 0;font-size:${pdfMode ? "11px" : "12px"};color:#334155;line-height:1.6;"><strong>${cells.join(' | ')}</strong></p>`);
            } else {
                result.push(`<p style="margin:4px 0;font-size:${pdfMode ? "11px" : "12px"};color:#475569;line-height:1.6;">${cells.join(' | ')}</p>`);
            }
        }
    // Horizontal Rule (strip the '---' marker as per Web UI's cleanMarkdownForPdf)
    } else if (line.trim() === "---" || line.trim() === "***" || line.trim() === "___") {
        if (inList) { result.push("</ul>"); inList = false; }
        result.push('<hr style="border: none; border-top: 1px solid #e2e8f0; margin: 16px 0;">');
    // Empty line
    } else if (line.trim() === "") {
      if (inList) { result.push("</ul>"); inList = false; }
      result.push('<br style="line-height:0;display:block;margin:4px 0;">');
    // Normal paragraph
    } else {
      if (inList) { result.push("</ul>"); inList = false; }
      result.push(`<p style="margin:6px 0;font-size:${pdfMode ? "11px" : "12px"};line-height:1.7;color:#475569;">${line}</p>`);
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

  let bodyContent = ''; // This will hold all the content within <div style="max-width:900px;margin:0 auto;padding:0;">

  // Header Section
  bodyContent += `<div style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; background-color: #ffffff;">
    <div style="max-width: 900px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between;">
      ${report.logoBase64 ? `<img src="${report.logoBase64}" alt="Company Logo" style="height: 28px; width: auto; object-fit: contain;">` : `<span style="font-size: 18px; font-weight: 900; letter-spacing: -0.5px; color: #0f172a;">Pixel Punch</span>`}
      <span style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 2px; color: #64748b;">${report.reportType === 'cost' ? 'AI Cost Audit' : 'AI Opportunity Audit'}</span>
    </div>
  </div>`;

  // Main Title and Metadata
  bodyContent += `<div style="max-width: 900px; margin: 0 auto; padding: 24px 16px 24px 16px; text-align: center; margin-bottom: 24px;">
    <h1 style="font-size: ${mode === 'pdf' ? '30px' : '24px'}; font-weight: 700; color: #0f172a; margin: 0 0 8px 0; line-height: 1.2; page-break-after: avoid;">${stripLeadingHyphens(report.title)}</h1>
    <p style="font-size: ${mode === 'pdf' ? '10px' : '12px'}; color: #64748b; margin: 0;">Generated: ${report.timestamp}</p>
    ${Object.keys(report.metadata).map(key => `<p style="font-size: ${mode === 'pdf' ? '10px' : '12px'}; color: #64748b; margin: 0;"><strong>${key}:</strong> ${report.metadata[key]}</p>`).join('')}
  </div>`;

  // Scorecard Section
  if (report.scorecard && report.scorecard.dimensions && report.scorecard.dimensions.length > 0) {
    const scorecardHtml = `
      <div style="padding: 32px 40px; background: linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%); border-bottom: 1px solid #e2e8f0; page-break-inside: avoid; margin-bottom: 24px;">
        <h2 style="font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #64748b; margin: 0 0 20px 0; page-break-after: avoid;">RAG Scorecard Overview</h2>
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="page-break-inside: avoid;">
          <tr>
            <td width="48%" valign="middle" style="padding: 16px; background: #fff; border-radius: 12px; border: 1px solid #e2e8f0; text-align: center;">
              ${generatePieChart([
                { label: "Spend", value: report.scorecard.dimensions[0].value, color: ragColor(report.scorecard.dimensions[0].value) },
                { label: "Architecture", value: report.scorecard.dimensions[1].value, color: ragColor(report.scorecard.dimensions[1].value) },
                { label: "Pain", value: report.scorecard.dimensions[2].value, color: ragColor(report.scorecard.dimensions[2].value) }
              ])}
              <div style="display: flex; gap: 12px; margin-top: 16px; flex-wrap: wrap; justify-content: center;">
                <div style="display: flex; align-items: center; gap: 6px; font-size: 10px; color: #64748b;">
                  <span style="width: 10px; height: 10px; background: ${ragColor(report.scorecard.dimensions[0].value)}; border-radius: 2px;"></span>
                  <span>Spend</span>
                </div>
                <div style="display: flex; align-items: center; gap: 6px; font-size: 10px; color: #64748b;">
                  <span style="width: 10px; height: 10px; background: ${ragColor(report.scorecard.dimensions[1].value)}; border-radius: 2px;"></span>
                  <span>Architecture</span>
                </div>
                <div style="display: flex; align-items: center; gap: 6px; font-size: 10px; color: #64748b;">
                  <span style="width: 10px; height: 10px; background: ${ragColor(report.scorecard.dimensions[2].value)}; border-radius: 2px;"></span>
                  <span>Pain</span>
                </div>
              </div>
            </td>
            <td width="4%"></td>
            <td width="48%" valign="top">
              <div style="display: flex; flex-direction: column; gap: 12px;">
                ${[
                  ["Spend & Visibility", report.scorecard.dimensions[0].value],
                  ["Architecture Risk", report.scorecard.dimensions[1].value],
                  ["Business Pain & Urgency", report.scorecard.dimensions[2].value]
                ].map(([label, val]) => `
                  <div style="background: #fff; border-radius: 8px; border: 1.5px solid ${ragColor(val as string)}40; padding: 12px; display: flex; align-items: center; justify-content: space-between;">
                    <div>
                      <div style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">${label}</div>
                      <div style="font-size: 16px; font-weight: 900; color: ${ragColor(val as string)};">${(val as string).toUpperCase()}</div>
                    </div>
                    <div style="text-align: right;">
                      <div style="font-size: 9px; color: ${ragColor(val as string)}; font-weight: 600;">${ragLabel(val as string)}</div>
                      <div style="font-size: 8px; background-color: ${ragBg(val as string)}; color: ${ragText(val as string)}; padding: 2px 6px; border-radius: 4px; margin-top: 2px; display: inline-block;">${(val as string).toUpperCase()}</div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </td>
          </tr>
        </table>
      </div>`;

    bodyContent += scorecardHtml;
  }

  // Confidence Score Section
  if (report.confidenceScore) {
    bodyContent += `
      <div style="padding: 16px; border-bottom: 1px solid #e2e8f0; page-break-inside: avoid; margin-bottom: 24px;">
        <h2 style="font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #64748b; margin: 0 0 16px 0; display: flex; align-items: center; gap: 8px; page-break-after: avoid;">
          <span style="color: #3b82f6;">&#128200;</span>
          AI Infrastructure Audit Evidence Verification
        </h2>
        <div style="display: grid; grid-template-columns: ${mode === 'pdf' ? '1fr' : '1fr 2fr'}; gap: ${mode === 'pdf' ? '12px' : '16px'}; page-break-inside: avoid;">
          <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 12px; border-radius: 8px; background: #f8fafc; border: 1px solid #e2e8f0;">
            <span style="font-size: 9px; color: #64748b; font-weight: 600; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 1px;">Audit Confidence</span>
            <span style="font-size: ${mode === 'pdf' ? '24px' : '32px'}; font-weight: 900; color: #2563eb;">${report.confidenceScore}</span>
            <span style="font-size: 8px; text-transform: uppercase; font-weight: 700; margin-top: 8px; padding: 4px 8px; border-radius: 4px; background: #e0f2fe; border: 1px solid #bfdbfe; color: #2563eb;">
              ${Number(report.confidenceScore.replace("%", "")) >= 70 ? "High Data Depth" : Number(report.confidenceScore.replace("%", "")) >= 40 ? "Medium Data Depth" : "Low Data Depth"}
            </span>
          </div>
          <div style="display: flex; flex-direction: column; justify-content: center; gap: 8px; font-size: 10px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px;">
              <span style="color: #64748b; font-weight: 500;">Billed Provider:</span>
              <span style="color: #0f172a; font-weight: 600; text-align: right; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">AI Systems Detected</span>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px;">
              <span style="color: #64748b; font-weight: 500;">Audited Spend Run:</span>
              <span style="font-weight: 800; text-align: right; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #dc2626;">High Leakage Risk</span>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
              <span style="color: #64748b; font-weight: 500;">Identified Waste:</span>
              <span style="font-weight: 600; text-align: right; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #dc2626;">CRITICAL RISK: Unlock Details</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Define the desired order of sections
  const sectionOrder = [
    'insights',
    'findings',
    'recommendations',
    'auditReport',
    'roadmap',
  ];

  // Map sections by ID for easy lookup
  const sectionsMap = new Map<string, ReportSection>();
  report.sections.forEach(section => {
    sectionsMap.set(section.id, section);
  });

  // Temporary storage for findings and recommendations to render them together
  let findingsSectionHtml = '';
  let recommendationsSectionHtml = '';

  // Iterate through the defined order and render sections
  sectionOrder.forEach(sectionId => {
    const section = sectionsMap.get(sectionId);
    if (!section) return; // Skip if section not found in report data

    if (section.id === 'insights') {
      bodyContent += `
        <div style="padding: 16px; margin-bottom: 24px; border-bottom: 1px solid #e2e8f0; page-break-inside: avoid;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
            <h2 style="font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #64748b; display: flex; align-items: center; gap: 8px; page-break-after: avoid;">
              <span style="color: #3b82f6;">&#128161;</span>
              ${stripLeadingHyphens(section.title)}
            </h2>
          </div>
          <div style="display: flex; flex-direction: column; gap: 12px; page-break-inside: avoid;">
            ${section.items.map(item => `
              <div style="display: flex; gap: 12px; align-items: flex-start; page-break-inside: avoid;">
                <span style="flex-shrink: 0; margin-top: 4px; color: #2563eb;">&#10003;</span>
                <p style="font-size: ${mode === 'pdf' ? '11px' : '12px'}; color: #475569; line-height: 1.6;">${item.content}</p>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    } else if (section.id === 'findings') {
      findingsSectionHtml = `
        <div style="background: #fff; border-radius: 10px; border: 1px solid #fee2e2; padding: 16px; page-break-inside: avoid;">
          <h3 style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #dc2626; margin: 0 0 12px 0; page-break-after: avoid;">⚠ Key Findings (${section.items.length})</h3>
          <ul style="list-style: none; padding: 0; margin: 0; page-break-inside: avoid;">
            ${section.items.map(item => `
              <li style="font-size: 10px; color: #475569; padding: 6px 0; border-bottom: 1px solid #fee2e2; display: flex; gap: 8px; align-items: flex-start; page-break-inside: avoid;">
                <span style="color:#dc2626;font-weight:700;">&bull;</span><span>${mdToHtml(item.content, { pdfMode: mode === 'pdf', emailMode: mode === 'email' })}</span>
              </li>
            `).join('')}
          </ul>
        </div>
      `;
    } else if (section.id === 'recommendations') {
      recommendationsSectionHtml = `
        <div style="background: #fff; border-radius: 10px; border: 1px solid #dcfce7; padding: 16px; page-break-inside: avoid;">
          <h3 style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #16a34a; margin: 0 0 12px 0; page-break-after: avoid;">✓ Recommendations (${section.items.length})</h3>
          <ul style="list-style: none; padding: 0; margin: 0; page-break-inside: avoid;">
            ${section.items.map(item => `
              <li style="font-size: 10px; color: #475569; padding: 6px 0; border-bottom: 1px solid #dcfce7; display: flex; gap: 8px; align-items: flex-start; page-break-inside: avoid;">
                <span style="color:#16a34a;font-weight:700;">&bull;</span><span>${mdToHtml(item.content, { pdfMode: mode === 'pdf', emailMode: mode === 'email' })}</span>
              </li>
            `).join('')}
          </ul>
        </div>
      `;
    } else if (section.id === 'auditReport') {
      bodyContent += `
        <div style="padding: 16px; margin-bottom: 24px; border-bottom: 1px solid #e2e8f0; page-break-inside: avoid;">
          <h2 style="font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #64748b; margin: 0 0 16px 0; page-break-after: avoid;">Full Technical Audit</h2>
          <div style="font-size: ${mode === 'pdf' ? '11px' : '12px'}; color: #475569; line-height: 1.7; white-space: pre-wrap; background: #f8fafc; border-radius: 8px; padding: 16px; border: 1px solid #e2e8f0; page-break-inside: avoid;">${section.items[0].content}</div>
        </div>
      `;
    } else if (section.id === 'roadmap') {
      bodyContent += `
        <div style="padding: 16px; margin-bottom: 24px; border-bottom: 1px solid #e2e8f0; page-break-inside: avoid;">
          <h2 style="font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #64748b; margin: 0 0 16px 0; page-break-after: avoid;">AI Roadmap & Phased Adoption</h2>
          <div style="display: flex; flex-direction: column; gap: 16px; page-break-inside: avoid;">
            ${section.items.map(item => {
              if (item.type === 'paragraph') {
                return `<p style="font-size: ${mode === 'pdf' ? '11px' : '12px'}; color: #334155; line-height: 1.6; margin: 0; page-break-inside: avoid;">${item.content}</p>`;
              } else if (item.type === 'list') {
                return `<ul style="list-style: none; padding: 0; margin: 0; page-break-inside: avoid;">
                  ${item.content.split('\n').map(listItem => {
                    const trimmed = listItem.replace(/^\*\s*/, ''); // Remove the leading asterisk
                    return `<li style="font-size: ${mode === 'pdf' ? '10px' : '12px'}; color: #475569; padding: 4px 0; display: flex; gap: 8px; align-items: flex-start; page-break-inside: avoid;"><span style="color:#2563eb;font-weight:700;">&bull;</span><span>${trimmed}</span></li>`;
                  }).join('')}
                </ul>`;
              }
              return '';
            }).join('')}
          </div>
        </div>
      `;
    } else {
      // Generic section rendering for other types
      bodyContent += `<div style="padding: 16px; margin-bottom: 24px; border-bottom: 1px solid #e2e8f0; page-break-inside: avoid;">
        <h2 style="font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #64748b; margin: 0 0 16px 0; page-break-after: avoid;">${stripLeadingHyphens(section.title)}</h2>`;
      if (section.subtext) {
        bodyContent += `<p style="font-size: ${mode === 'pdf' ? '11px' : '12px'}; color: #64748b; margin-bottom:15px; page-break-inside: avoid;">${section.subtext}</p>`;
      }

      section.items.forEach(item => {
        let itemHtml = '';
        const markdownOptions = { pdfMode: mode === 'pdf', emailMode: mode === 'email' };

        switch (item.type) {
          case 'paragraph':
            itemHtml = `<p style="margin:6px 0;font-size:${mode === 'pdf' ? "11px" : "12px"};line-height:1.7;color:#475569; page-break-inside: avoid;">${item.content}</p>`;
            break;
          case 'list':
            itemHtml = mdToHtml(item.content, markdownOptions); // Let mdToHtml handle list formatting
            break;
          case 'code': // Handle code blocks
            itemHtml = `<pre style="background-color:#f4f4f4;padding:10px;border-radius:5px;overflow-x:auto;font-size:${mode === 'pdf' ? "10px" : "12px"};color:#333; page-break-inside: avoid;"><code>${item.content}</code></pre>`;
            break;
          case 'image': // Handle images
            itemHtml = `<img src="${item.content}" alt="" style="max-width:100%;height:auto;display:block;margin:10px 0; page-break-inside: avoid;">`;
            break;
          default:
            itemHtml = `<p style="margin:6px 0;font-size:${mode === 'pdf' ? "11px" : "12px"};line-height:1.7;color:#475569; page-break-inside: avoid;">${item.content}</p>`;
        }

        if (locked && item.type === 'paragraph') {
          itemHtml = itemHtml.replace(/<p(.*?)>(.*?)<\/p>/, `<p$1 style="filter: blur(3px); user-select: none; pointer-events: none; page-break-inside: avoid;">$2</p>`);
        }
        bodyContent += itemHtml;
      });
      bodyContent += `</div>`; // Close the generic section div
    }
  });

  // Render Findings and Recommendations in a combined block if both exist
  if (findingsSectionHtml || recommendationsSectionHtml) {
    bodyContent += `
      <div style="padding: 16px; margin-bottom: 24px; border-bottom: 1px solid #e2e8f0; page-break-inside: avoid;">
        <h2 style="font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #64748b; margin: 0 0 16px 0; page-break-after: avoid;">Analysis Summary</h2>
        <div style="display: ${findingsSectionHtml && recommendationsSectionHtml ? 'grid' : 'block'}; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; page-break-inside: avoid;">
          ${findingsSectionHtml}
          ${recommendationsSectionHtml}
        </div>
      </div>
    `;
  }

  // Final HTML assembly
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
  <div style="max-width:900px;margin:0 auto;padding:0;">
    ${bodyContent}
  </div>
  <!-- Footer -->
  <div style="padding: 20px 40px; background: #1e1b4b; text-align: center; page-break-before: always;">
    <p style="color: rgba(255,255,255,0.5); font-size: 10px; margin: 0;">Generated by Pixel Punch AI · pixelpunch.org · © 2026 Pixel Punch. Confidential.</p>
  </div>
</body>
</html>`;

  return html;
}
