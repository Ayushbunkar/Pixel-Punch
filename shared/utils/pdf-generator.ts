import { ReportData, renderReportToHtml } from "./report-content-generator";
import { BrowserFactory } from "./browser-factory";
import { Logger } from "./logger";
import fs from "fs";
import path from "path";
import scoreDescriptions from "../config/score-descriptions.json";

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

function roundedRectPath(x: number, y: number, w: number, h: number, r: number) {
  const k = r * 0.552284749831;
  return `${x + r} ${y} m ${x + w - r} ${y} l ${x + w - r + k} ${y} ${x + w} ${y + r - k} ${x + w} ${y + r} c ${x + w} ${y + h - r} l ${x + w} ${y + h - r + k} ${x + w - r + k} ${y + h} ${x + w - r} ${y + h} c ${x + r} ${y + h} l ${x + r - k} ${y + h} ${x} ${y + h - r + k} ${x} ${y + h - r} c ${x} ${y + r} l ${x} ${y + r - k} ${x + r - k} ${y} ${x + r} ${y} c`;
}

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";
  for (const word of words) {
    if ((currentLine + " " + word).length > maxChars) {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine += (currentLine ? " " : "") + word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

export function generateBasicTextPdf(data: ReportData): Buffer {
  const objects: { id: number; data: string | Buffer }[] = [];
  
  let logoBuffer: Buffer | null = null;
  if (data.logoBase64 && data.logoBase64.startsWith("data:image/jpeg;base64,")) {
    logoBuffer = Buffer.from(data.logoBase64.split(",")[1], "base64");
  }
  
  const pagesData: { shapes: string[], textLines: { text: string, x: number, y: number, font: 'F1' | 'F2', size: number, r: number, g: number, b: number }[] }[] = [];
  
  let currentPage = { shapes: [] as string[], textLines: [] as any[] };
  let currentY = 780;
  
  const addPage = () => {
    if (currentPage.shapes.length > 0 || currentPage.textLines.length > 0) {
      pagesData.push(currentPage);
    }
    currentPage = { shapes: [], textLines: [] };
    currentY = 720; // Added more space below header
    
    currentPage.shapes.push(`0.05 0.43 0.99 rg\n0 790 595.28 52 re f`); 
    
    if (logoBuffer) {
      currentPage.shapes.push(`q 73 0 0 32 30 800 cm /Im1 Do Q`);
    } else {
      currentPage.textLines.push({ text: "Pixel Punch", x: 30, y: 810, font: 'F2', size: 18, r: 1, g: 1, b: 1 });
    }
    
    const subtitle = data.reportType === "cost" ? "AI COST AUDIT REPORT" : "AI OPPORTUNITY AUDIT REPORT";
    currentPage.textLines.push({ text: subtitle, x: 400, y: 812, font: 'F2', size: 10, r: 0.9, g: 0.9, b: 0.9 });
  };
  
  addPage();
  currentY = 690;
  
  const checkSpace = (needed: number) => {
    if (currentY - needed < 40) {
      addPage();
    }
  };

  const drawText = (text: string, x: number, font: 'F1'|'F2', size: number, r: number, g: number, b: number) => {
    currentPage.textLines.push({ text, x, y: currentY, font, size, r, g, b });
  };
  
  drawText(data.title.replace(/^-+\s*/, ''), 30, 'F2', 20, 0.06, 0.09, 0.16);
  currentY -= 20;
  drawText(`Generated: ${data.timestamp}`, 30, 'F1', 10, 0.39, 0.45, 0.54);
  currentY -= 30;
  
  for (const [k, v] of Object.entries(data.metadata || {})) {
    if (k === "Company") continue;
    const txt = `${k}: ${v}`;
    drawText(txt, 30, 'F1', 10, 0.2, 0.25, 0.33);
    currentY -= 15;
  }
  currentY -= 25;
  
  if (data.scorecard?.dimensions) {
    checkSpace(150);
    drawText("RAG SCORECARD OVERVIEW", 30, 'F2', 10, 0.39, 0.45, 0.54);
    currentY -= 20;
    
    let cardX = 30;
    const cardW = 170;
    
    const isCost = data.reportType === "cost";
    const labelMap: Record<number, string> = isCost
      ? { 0: "Spend Risk", 1: "Architecture Risk", 2: "Pain Risk" }
      : { 0: "Readiness Risk", 1: "Value Risk", 2: "Opportunity Risk" };
    const dimensionKeys = isCost
      ? ["spend", "architecture", "pain"]
      : ["readiness", "value", "opportunity"];

    // First pass to determine the max height based on wrapped text lines
    let maxLines = 0;
    const allDescLines: string[][] = [];
    for (let i = 0; i < data.scorecard.dimensions.length; i++) {
       const dim = data.scorecard.dimensions[i];
       const dimKey = dimensionKeys[i] || "spend";
       const dynamicDesc = (scoreDescriptions as Record<string, Record<string, string>>)[dimKey]?.[dim.value] || "";
       const descLines = wrapText(dynamicDesc, 28);
       allDescLines.push(descLines);
       if (descLines.length > maxLines) maxLines = descLines.length;
    }
    
    const baseHeight = 60; // top padding + title
    const bottomPadding = 16;
    const lineHeight = 12;
    // ensure minimum 110 height, but expand if text is long
    const cardH = Math.max(110, baseHeight + (maxLines * lineHeight) + bottomPadding);

    for (let i = 0; i < data.scorecard.dimensions.length; i++) {
       const dim = data.scorecard.dimensions[i];
       let rBg=0.97, gBg=0.98, bBg=0.99;
       let rBord=0.88, gBord=0.91, bBord=0.94;
       let rT=0.39, gT=0.45, bT=0.54;
       
       // Much lighter pastel colors requested by the user
       if (dim.value === 'red') { rBg=0.99; gBg=0.94; bBg=0.94; rBord=0.98; gBord=0.74; bBord=0.74; rT=0.86; gT=0.15; bT=0.15; }
       else if (dim.value === 'amber') { rBg=1; gBg=0.98; bBg=0.92; rBord=0.98; gBord=0.85; bBord=0.50; rT=0.85; gT=0.46; bT=0.03; }
       else if (dim.value === 'green') { rBg=0.94; gBg=1; bBg=0.95; rBord=0.62; gBord=0.93; bBord=0.77; rT=0.08; gT=0.63; bT=0.29; }
       
       const cardY = currentY - cardH;
       currentPage.shapes.push(`${rBg} ${gBg} ${bBg} rg\n${roundedRectPath(cardX, cardY, cardW, cardH, 12)} f`);
       currentPage.shapes.push(`${rBord} ${gBord} ${bBord} RG\n1 w\n${roundedRectPath(cardX, cardY, cardW, cardH, 12)} S`);
       
       const statusIcon = dim.value === "green" ? "(v)" : "[!]";
       const statusText = dim.value === "red" ? "HIGH RISK" : dim.value === "amber" ? "NEEDS ATTENTION" : "LOW RISK";
       const badgeText = `${statusIcon} ${statusText}`;
       currentPage.textLines.push({ text: badgeText, x: cardX + 16, y: cardY + cardH - 24, font: 'F2', size: 9, r: rT, g: gT, b: bT });
       
       const displayLabel = labelMap[i] ?? dim.label;
       currentPage.textLines.push({ text: displayLabel, x: cardX + 16, y: cardY + cardH - 42, font: 'F2', size: 14, r: 0.06, g: 0.09, b: 0.16 });
       
       const descLines = allDescLines[i];
       for (let j = 0; j < descLines.length; j++) {
         currentPage.textLines.push({ text: descLines[j], x: cardX + 16, y: cardY + cardH - 60 - (j * 12), font: 'F1', size: 9, r: 0.28, g: 0.33, b: 0.41 });
       }
       
       
       cardX += cardW + 10;
    }
    currentY -= (cardH + 30);
  }
  
  for (const sec of data.sections || []) {
    checkSpace(50);
    drawText(sec.title.toUpperCase(), 30, 'F2', 12, 0.06, 0.09, 0.16);
    currentY -= 20;
    
    for (const item of sec.items || []) {
      const itemText = String(item.content || "");
      const lines = itemText.split("\n");
      for (const line of lines) {
        let lineText = line.trim();
        if (!lineText && item.type !== "paragraph") continue;
        
        let isBold = false;
        
        let isList = false;
        let isHeading = false;
        
        if (lineText.startsWith('#')) {
           lineText = lineText.replace(/^#+\s*/, '');
           isBold = true;
           isHeading = true;
           currentY -= 5;
        }
        
        if (lineText.startsWith('- ') || lineText.startsWith('* ')) {
           lineText = lineText.substring(2);
           isList = true;
        }
        
        if (lineText.startsWith('**')) {
           isBold = true;
        }
        
        lineText = lineText.replace(/\*\*/g, '').replace(/\*/g, '');
        // Replace en-dash and em-dash with standard hyphen to fix encoding issues in WinAnsiEncoding
        lineText = lineText.replace(/[\u2013\u2014]/g, "-");
        
        if (!isList && !isHeading && lineText.match(/^([a-zA-Z0-9\s&_]+):(\s|$)/)) {
           isList = true;
        }
        
        if (isList) {
           lineText = "__BULLET__ " + lineText;
        }
        
        const words = lineText.split(" ");
        let currentLine = "";
        let isFirstWrap = true;
        
        for (const word of words) {
           let indent = 0;
           // approximate character limit per line for width
           const maxChars = isBold ? 85 : 95;
           if ((currentLine + " " + word).length > maxChars) {
              checkSpace(20);
              drawText(currentLine, 30, isBold ? 'F2' : 'F1', 10, 0.27, 0.33, 0.41);
              currentY -= 15;
              currentLine = word;
              isFirstWrap = false;
           } else {
              currentLine += (currentLine ? " " : "") + word;
           }
        }
        if (currentLine) {
           checkSpace(20);
           drawText(currentLine, 30, isBold ? 'F2' : 'F1', 10, 0.27, 0.33, 0.41);
           currentY -= 15;
        }
      }
      currentY -= 10;
    }
    currentY -= 10;
  }
  
  const pageCount = pagesData.length;
  const kidsStr = pagesData.map((_, i) => `${3 + i} 0 R`).join(" ");
  objects.push({ id: 1, data: `<< /Type /Catalog /Pages 2 0 R >>` });
  objects.push({ id: 2, data: `<< /Type /Pages /Kids [${kidsStr}] /Count ${pageCount} >>` });
  
  const fontF1Id = pageCount + 3;
  const fontF2Id = pageCount + 4;
  objects.push({ id: fontF1Id, data: `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>` });
  objects.push({ id: fontF2Id, data: `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>` });
  
  let nextObjId = pageCount + 5;
  let logoObjId = -1;
  
  if (logoBuffer) {
    logoObjId = nextObjId++;
    objects.push({
      id: logoObjId,
      data: Buffer.concat([
        Buffer.from(`<< /Type /XObject /Subtype /Image /Width 1280 /Height 562 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${logoBuffer.length} >>\nstream\n`),
        logoBuffer,
        Buffer.from(`\nendstream`)
      ])
    });
  }
  
  const resourcesObj = `<< /Font << /F1 ${fontF1Id} 0 R /F2 ${fontF2Id} 0 R >> ${logoObjId !== -1 ? `/XObject << /Im1 ${logoObjId} 0 R >>` : ''} >>`;
  
  pagesData.forEach((pageData, pageIdx) => {
    const pageId = 3 + pageIdx;
    const contentId = nextObjId++;
    
    objects.push({
      id: pageId,
      data: `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Contents ${contentId} 0 R /Resources ${resourcesObj} >>`
    });
    
    let streamText = ``;
    
    if (pageData.shapes.length > 0) {
       streamText += pageData.shapes.join("\n") + "\n";
    }
    
    streamText += `BT\n`;
    let lastFont = '';
    let lastSize = 0;
    let lastR = -1, lastG = -1, lastB = -1;
    
    for (const line of pageData.textLines) {
      if (line.font !== lastFont || line.size !== lastSize) {
         streamText += `/${line.font} ${line.size} Tf\n`;
         lastFont = line.font;
         lastSize = line.size;
      }
      if (line.r !== lastR || line.g !== lastG || line.b !== lastB) {
         streamText += `${line.r.toFixed(3)} ${line.g.toFixed(3)} ${line.b.toFixed(3)} rg\n`;
         lastR = line.r; lastG = line.g; lastB = line.b;
      }
      
      let escapedLine = line.text
        .replace(/\\/g, "\\\\")
        .replace(/\(/g, "\\(")
        .replace(/\)/g, "\\)");
        
      escapedLine = escapedLine.replace(/__BULLET__/g, "\\225");
        
      streamText += `${line.x.toFixed(2)} ${line.y.toFixed(2)} Td\n(${escapedLine}) Tj\n-${line.x.toFixed(2)} -${line.y.toFixed(2)} Td\n`;
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
