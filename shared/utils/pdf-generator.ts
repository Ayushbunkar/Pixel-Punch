import { ReportData, renderReportToHtml } from "./report-content-generator";
import { BrowserFactory } from "./browser-factory";
import { Logger } from "./logger";
import fs from "fs";
import path from "path";

// ── RAG Color Config ───────────────────────────────────────────────────────────────

// ── Tier Styles ─────────────────────────────────────────────────────────────────────
export const TIER_STYLES = {
  1: { bg: "#fff1f2", text: "#be123c", border: "#fca5a5", badge: "#dc2626", description: "An immediate, full AI Cost Audit is strongly recommended to stop active cost leakage." },
  2: { bg: "#fffbeb", text: "#92400e", border: "#fcd34d", badge: "#d97706", description: "A targeted architectural optimization sprint is advised to reduce identified waste." },
  3: { bg: "#f0fdf4", text: "#14532d", border: "#86efac", badge: "#16a34a", description: "Periodic monitoring and a lightweight quarterly review is suggested." },
  4: { bg: "#f8fafc", text: "#334155", border: "#e2e8f0", badge: "#64748b", description: "No immediate action required at your current scale." },
};

export function getTierStyles(tier: number) {
  return TIER_STYLES[tier as keyof typeof TIER_STYLES] || TIER_STYLES[4];
}


export async function loadLogoBase64(): Promise<string> {
  try {
    const logoPath = path.join(process.cwd(), "public", "logo.jpg");
    if (fs.existsSync(logoPath)) {
      const logoData = fs.readFileSync(logoPath);
      return `data:image/jpeg;base64,${logoData.toString("base64")}`;
    }
  } catch (err) {
    console.warn("[pdf-generator] Could not load logo.jpg, using placeholder");
  }
    return "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
}

export function generateBasicTextPdf(data: ReportData): Buffer {
  const objects: { id: number; data: string | Buffer }[] = [];
  
  const contentLines: string[] = [];
  contentLines.push(`PIXEL PUNCH — AUDIT REPORT`);
  contentLines.push(`=================================`);
  contentLines.push(``);
  contentLines.push(`Report: ${data.title}`);
  contentLines.push(`Date: ${data.timestamp}`);
  contentLines.push(``);
  
  contentLines.push(`METADATA:`);
  for (const [k, v] of Object.entries(data.metadata || {})) {
    if (k === "Company") continue;
    contentLines.push(`- ${k}: ${v}`);
  }
  contentLines.push(``);
  
  if (data.scorecard?.dimensions) {
    contentLines.push(`SCORECARD:`);
    for (const dim of data.scorecard.dimensions) {
      const statusText = dim.value === "red" ? "HIGH RISK" : dim.value === "amber" ? "NEEDS ATTENTION" : "LOW RISK";
      contentLines.push(`- ${dim.label}: ${statusText}`);
    }
    contentLines.push(``);
  }
  
  if (data.confidenceScore) {
    contentLines.push(`Confidence Score: ${data.confidenceScore}`);
    contentLines.push(``);
  }
  
  for (const sec of data.sections || []) {
    contentLines.push(`---------------------------------`);
    contentLines.push(sec.title.toUpperCase());
    contentLines.push(`---------------------------------`);
    for (const item of sec.items || []) {
      const itemText = String(item.content || "");
      const lines = itemText.split("\n");
      for (const line of lines) {
        if (!line.trim() && item.type !== "paragraph") continue;
        contentLines.push(line.trim());
      }
    }
    contentLines.push(``);
  }
  
  const wrappedLines: string[] = [];
  for (const line of contentLines) {
    if (line.length <= 80) {
      wrappedLines.push(line);
    } else {
      let remaining = line;
      while (remaining.length > 80) {
        let spaceIdx = remaining.lastIndexOf(" ", 80);
        if (spaceIdx === -1 || spaceIdx < 40) spaceIdx = 80;
        wrappedLines.push(remaining.substring(0, spaceIdx));
        remaining = remaining.substring(spaceIdx).trim();
      }
      if (remaining) wrappedLines.push(remaining);
    }
  }
  
  const linesPerPage = 45;
  const pages: string[][] = [];
  for (let i = 0; i < wrappedLines.length; i += linesPerPage) {
    pages.push(wrappedLines.slice(i, i + linesPerPage));
  }
  if (pages.length === 0) pages.push(["No report content generated."]);
  
  const pageCount = pages.length;
  const kidsStr = pages.map((_, i) => `${3 + i} 0 R`).join(" ");
  objects.push({ id: 1, data: `<< /Type /Catalog /Pages 2 0 R >>` });
  objects.push({ id: 2, data: `<< /Type /Pages /Kids [${kidsStr}] /Count ${pageCount} >>` });
  
  const fontObjId = pageCount + 3;
  objects.push({ id: fontObjId, data: `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>` });
  
  pages.forEach((pageLines, pageIdx) => {
    const pageId = 3 + pageIdx;
    const contentId = 3 + pageCount + 1 + pageIdx;
    
    objects.push({
      id: pageId,
      data: `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Contents ${contentId} 0 R /Resources << /Font << /F1 ${fontObjId} 0 R >> >> >>`
    });
    
    let streamText = `BT\n/F1 10 Tf\n20 TL\n50 780 Td\n`;
    for (const line of pageLines) {
      const escapedLine = line
        .replace(/\\/g, "\\\\")
        .replace(/\(/g, "\\(")
        .replace(/\)/g, "\\)");
      streamText += `(${escapedLine}) Tj\nT*\n`;
    }
    streamText += `ET`;
    
    const streamBuffer = Buffer.from(streamText, "utf-8");
    objects.push({
      id: contentId,
      data: Buffer.concat([
        Buffer.from(`<< /Length ${streamBuffer.length} >>\nstream\n`),
        streamBuffer,
        Buffer.from(`\nendstream`)
      ])
    });
  });
  
  objects.sort((a, b) => a.id - b.id);
  
  const bodyBuffers: Buffer[] = [];
  const offsets: number[] = [];
  let currentOffset = 0;
  
  const headerStr = `%PDF-1.4\n`;
  bodyBuffers.push(Buffer.from(headerStr));
  currentOffset += headerStr.length;
  
  for (const obj of objects) {
    offsets[obj.id] = currentOffset;
    const startStr = `${obj.id} 0 obj\n`;
    bodyBuffers.push(Buffer.from(startStr));
    currentOffset += startStr.length;
    
    if (Buffer.isBuffer(obj.data)) {
      bodyBuffers.push(obj.data);
      currentOffset += obj.data.length;
    } else {
      const dataStr = obj.data + `\n`;
      bodyBuffers.push(Buffer.from(dataStr));
      currentOffset += dataStr.length;
    }
    
    const endStr = `endobj\n`;
    bodyBuffers.push(Buffer.from(endStr));
    currentOffset += endStr.length;
  }
  
  const xrefOffset = currentOffset;
  let xrefStr = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objects.length; i++) {
    const padOffset = String(offsets[i]).padStart(10, '0');
    xrefStr += `${padOffset} 00000 n \n`;
  }
  xrefStr += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  bodyBuffers.push(Buffer.from(xrefStr));
  
  return Buffer.concat(bodyBuffers);
}

export async function generatePdf(data: ReportData): Promise<Buffer> {
  const logoBase64 = data.logoBase64 || "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wgARCAIyBQADASIAAREBAxEB/8QAGwABAAIDAQEA";
  
  let browser;
  try {
    browser = await BrowserFactory.create();

    const page = await browser.newPage();
    
    const html = renderReportToHtml(data, { mode: 'pdf' });

    await page.setContent(html, { waitUntil: "domcontentloaded" });

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "20mm", right: "20mm", bottom: "20mm", left: "20mm" },
    });

    return Buffer.from(pdf);
  } catch (error: unknown) {
    Logger.error(`[pdf-generator] Puppeteer generation failed, falling back to basic text PDF. Error: ${error}`);
    try {
      return generateBasicTextPdf(data);
    } catch (fallbackError) {
      Logger.error(`[pdf-generator] Fallback PDF generation also failed: ${fallbackError}`);
      throw fallbackError;
    }
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        Logger.warn(`[pdf-generator] Failed to close browser: ${closeError}`);
      }
    }
  }
}
