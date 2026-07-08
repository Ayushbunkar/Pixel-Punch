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
    
    // Decorative background circles (very light blue) on the right side
    currentPage.shapes.push(`0.90 0.94 1.0 rg\n${roundedRectPath(300, 450, 350, 350, 175)} f`); // Large circle
    currentPage.shapes.push(`0.82 0.89 0.99 rg\n${roundedRectPath(450, 350, 200, 200, 100)} f`); // Small circle
    
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
  
  if (data.reportType === "cost") {
    checkSpace(250);
    drawText("SAVINGS PROJECTION AND NEXT STEPS", 30, 'F2', 14, 0.06, 0.09, 0.16);
    currentY -= 20;
    
    const projDesc = "The audit summary suggests meaningful savings are available once repeated token waste, unnecessary context injection, and un-routed model calls are reduced.";
    const projDescLines = wrapText(projDesc, 90);
    for (const line of projDescLines) {
      drawText(line, 30, 'F1', 10, 0.28, 0.33, 0.41);
      currentY -= 15;
    }
    currentY -= 10;
    
    const startY = currentY;
    const rowH = 28;
    const rows = [
      { label: "Current monthly AI spend", val: "$12,500", bg: "0.97 0.98 0.99" },
      { label: "Month 1 after quick wins", val: "$10,400", bg: "1.0 1.0 1.0" },
      { label: "Month 2 after routing + caching", val: "$8,900", bg: "0.97 0.98 0.99" },
      { label: "Month 3 after full optimisation", val: "$7,600", bg: "1.0 1.0 1.0" },
      { label: "Estimated annual savings", val: "$54,000", bg: "0.94 0.99 0.95" }
    ];
    
    const tW = 535;
    for (let i = 0; i < rows.length; i++) {
       const bg = rows[i].bg;
       currentPage.shapes.push(`${bg} rg\n30 ${currentY - rowH} ${tW} ${rowH} re f`);
       currentPage.shapes.push(`0.88 0.91 0.94 RG\n1 w\n30 ${currentY} m ${30 + tW} ${currentY} l S`);
       
       drawText(rows[i].label, 40, 'F2', 10, 0.2, 0.25, 0.33);
       drawText(rows[i].val, 300, 'F2', 11, 0.06, 0.09, 0.16);
       
       currentY -= rowH;
    }
    currentPage.shapes.push(`0.88 0.91 0.94 RG\n1 w\n30 ${currentY} m ${30 + tW} ${currentY} l S`);
    currentPage.shapes.push(`0.88 0.91 0.94 RG\n1 w\n30 ${startY} m 30 ${currentY} l S`);
    currentPage.shapes.push(`0.88 0.91 0.94 RG\n1 w\n290 ${startY} m 290 ${currentY} l S`);
    currentPage.shapes.push(`0.88 0.91 0.94 RG\n1 w\n${30+tW} ${startY} m ${30+tW} ${currentY} l S`);
    
    currentY -= 40;
    
    checkSpace(200);
    drawText("90-DAY ROADMAP", 30, 'F2', 14, 0.06, 0.09, 0.16);
    currentY -= 20;
    
    const rW = 171;
    const rH = 90;
    const roadmaps = [
      { title: "Immediate", items: ["Prompt caching", "Model routing", "RAG pruning"], bg: "0.91 0.96 1", border: "0.75 0.86 0.98" },
      { title: "30 Days", items: ["LiteLLM gateway", "Langfuse observability", "Semantic cache"], bg: "0.93 0.94 1", border: "0.82 0.85 0.98" },
      { title: "90 Days", items: ["Centralized governance", "Automated routing", "ROI dashboard"], bg: "0.91 0.99 0.91", border: "0.67 0.95 0.72" }
    ];
    
    for (let i = 0; i < roadmaps.length; i++) {
       const rx = 30 + i * (rW + 11);
       const ry = currentY - rH;
       currentPage.shapes.push(`${roadmaps[i].bg} rg\n${rx} ${ry} ${rW} ${rH} re f`);
       currentPage.shapes.push(`${roadmaps[i].border} RG\n1 w\n${rx} ${ry} ${rW} ${rH} re S`);
       
       drawText(roadmaps[i].title, rx + 12, 'F2', 11, 0.06, 0.09, 0.16);
       
       let ix = rx + 12;
       let iy = ry + rH - 35;
       for (const item of roadmaps[i].items) {
          currentPage.textLines.push({ text: "__BULLET__ " + item, x: ix, y: iy, font: 'F1', size: 9, r: 0.2, g: 0.25, b: 0.33 });
          iy -= 15;
       }
    }
    currentY -= (rH + 30);
    
    drawText("Why this matters", 30, 'F2', 11, 0.06, 0.09, 0.16);
    currentY -= 15;
    const matterLines = wrapText("This roadmap is sequenced to create fast savings first, then better routing, then governance and reporting. That order usually improves ROI while keeping implementation risk low.", 95);
    for (const line of matterLines) {
      drawText(line, 30, 'F1', 10, 0.28, 0.33, 0.41);
      currentY -= 15;
    }
    
    currentY -= 40;
    
    checkSpace(280);
    drawText("OPTIMIZATION OPPORTUNITIES", 30, 'F2', 14, 0.06, 0.09, 0.16);
    currentY -= 20;
    const oppDescLines = wrapText("These are the highest-leverage moves based on the audit pattern. The goal is to reduce token waste without changing the product experience.", 95);
    for (const line of oppDescLines) {
      drawText(line, 30, 'F1', 10, 0.28, 0.33, 0.41);
      currentY -= 15;
    }
    currentY -= 10;
    
    const ow = 171;
    const oh = 90;
    const opps = [
      { title: "Prompt Caching", desc: "Activate cache headers on all system instructions over 1k tokens. This can cut repeated input cost significantly.", border: "0.23 0.51 0.96", bg: "0.94 0.97 1" },
      { title: "Model Tiering", desc: "Route simple formatting, classification, and low-complexity actions to lighter models automatically.", border: "0.66 0.33 0.83", bg: "0.96 0.94 1" },
      { title: "RAG Pruning", desc: "Shrink chunk sizes, remove duplicate context, and add hybrid reranking before prompt assembly.", border: "0.13 0.77 0.36", bg: "0.94 0.99 0.95" }
    ];
    
    for (let i = 0; i < opps.length; i++) {
       const ox = 30 + i * (ow + 11);
       const oy = currentY - oh;
       currentPage.shapes.push(`${opps[i].bg} rg\n${ox} ${oy} ${ow} ${oh} re f`);
       currentPage.shapes.push(`${opps[i].border} RG\n2 w\n${ox} ${oy} ${ow} ${oh} re S`);
       drawText(opps[i].title, ox + 12, 'F2', 10, 0.06, 0.09, 0.16);
       
       let iy = oy + oh - 35;
       const dLines = wrapText(opps[i].desc, 28);
       for (const line of dLines) {
          currentPage.textLines.push({ text: line, x: ox + 12, y: iy, font: 'F1', size: 9, r: 0.28, g: 0.33, b: 0.41 });
          iy -= 12;
       }
    }
    currentY -= (oh + 30);
    
    drawText("Quick Wins", 30, 'F2', 12, 0.06, 0.09, 0.16);
    currentY -= 20;
    const wins = [
      "Enable native provider Prompt Caching for system prompts exceeding 1,024 tokens.",
      "Adopt Model Tiering: Route simple formatting queries to lighter model weights (e.g. GPT-4o-mini).",
      "Shrink RAG chunk sizes and add hybrid re-ranking to cut irrelevant context.",
      "Introduce semantic filters before prompt assembly to avoid context bloat."
    ];
    for (const win of wins) {
       const wLines = wrapText(win, 90);
       for (let i = 0; i < wLines.length; i++) {
          drawText(i===0 ? "__BULLET__ " + wLines[i] : wLines[i], i===0 ? 30 : 40, 'F1', 10, 0.28, 0.33, 0.41);
          currentY -= 15;
       }
       currentY -= 5;
    }
    currentY -= 20;
    
    checkSpace(280);
    drawText("Current Architecture Analysis", 30, 'F2', 14, 0.06, 0.09, 0.16);
    currentY -= 15;
    const archLines = wrapText("Known information from the audit indicates Azure OpenAI as the primary provider, Azure as the cloud layer, and a vector database in the stack. The audit also suggests the current workflow likely sends large system prompts and RAG context without gateway-level optimisation.", 95);
    for (const line of archLines) {
      drawText(line, 30, 'F1', 10, 0.28, 0.33, 0.41);
      currentY -= 12;
    }
    currentY -= 20;
    
    const cy = currentY - 50;
    const bh = 45;
    const nW = 115;
    const nodeX1 = 30;
    const nodeX2 = 175;
    const nodeX3 = 320;
    
    const drawLine = (xA: number, yA: number, xB: number, yB: number) => {
       currentPage.shapes.push(`0.7 0.7 0.7 RG\n1.5 w\n${xA} ${yA} m ${xB} ${yB} l S`);
    };
    
    drawLine(nodeX1+nW, cy+bh/2, nodeX2, cy+bh/2); 
    drawLine(nodeX2+nW, cy+bh/2, nodeX3, cy+bh/2); 
    drawLine(nodeX2+nW/2, cy, nodeX2+nW/2, cy-30); 
    drawLine(nodeX3+nW/2, cy, nodeX3+nW/2, cy-30); 
    
    const drawBox = (x: number, y: number, title: string, subtitle: string, bCol: string, bgCol: string) => {
       currentPage.shapes.push(`${bgCol} rg\n${roundedRectPath(x, y, nW, bh, 6)} f`);
       currentPage.shapes.push(`${bCol} RG\n1 w\n${roundedRectPath(x, y, nW, bh, 6)} S`);
       currentPage.textLines.push({ text: title, x: x + 10, y: y + bh - 16, font: 'F2', size: 10, r: 0.06, g: 0.09, b: 0.16 });
       const stLines = wrapText(subtitle, 24);
       for (let i = 0; i < stLines.length; i++) {
         currentPage.textLines.push({ text: stLines[i], x: x + 10, y: y + bh - 28 - (i*9), font: 'F1', size: 8, r: 0.4, g: 0.45, b: 0.5 });
       }
    };
    
    drawBox(nodeX1, cy, "Users", "Requests, workflows", "0.6 0.7 0.9", "0.94 0.96 1");
    drawBox(nodeX2, cy, "App Layer", "Chat, API", "0.2 0.8 0.6", "0.94 1 0.96");
    drawBox(nodeX2, cy-30-bh, "Vector DB", "Chunking, retrieval", "0.2 0.8 0.6", "0.94 1 0.96");
    drawBox(nodeX3, cy, "Model Gateway", "LiteLLM, routing", "0.5 0.5 0.9", "0.94 0.94 1");
    drawBox(nodeX3, cy-30-bh, "Azure OpenAI", "Premium calls", "0.9 0.5 0.5", "1 0.94 0.94");
    
    currentY = cy - 30 - bh - 40;
    
    const tW2 = 535;
    const rowH2 = 60;
    const ty = currentY - rowH2;
    
    currentPage.shapes.push(`0.97 0.98 0.99 rg\n30 ${currentY - 20} ${tW2} 20 re f`);
    currentPage.shapes.push(`0.88 0.91 0.94 RG\n1 w\n30 ${currentY} m ${30 + tW2} ${currentY} l S`);
    currentPage.shapes.push(`0.88 0.91 0.94 RG\n1 w\n30 ${currentY-20} m ${30 + tW2} ${currentY-20} l S`);
    currentPage.shapes.push(`0.88 0.91 0.94 RG\n1 w\n30 ${ty} m ${30 + tW2} ${ty} l S`);
    currentPage.shapes.push(`0.88 0.91 0.94 RG\n1 w\n30 ${ty} m 30 ${currentY} l S`);
    currentPage.shapes.push(`0.88 0.91 0.94 RG\n1 w\n290 ${ty} m 290 ${currentY} l S`);
    currentPage.shapes.push(`0.88 0.91 0.94 RG\n1 w\n${30+tW2} ${ty} m ${30+tW2} ${currentY} l S`);
    
    drawText("Observed Risks", 40, 'F2', 10, 0.2, 0.25, 0.33);
    drawText("What to fix first", 300, 'F2', 10, 0.2, 0.25, 0.33);
    
    const risk1Lines = [
       "1. Direct provider calls likely increase lock-in.",
       "2. Repeated system instructions ship in full.",
       "3. Static chunking bloats prompt windows."
    ];
    let ry1 = currentY - 35;
    for (const line of risk1Lines) {
       drawText(line, 40, 'F1', 9, 0.28, 0.33, 0.41);
       ry1 -= 12;
    }
    
    const fix1Lines = [
       "1. Spin up a Vector DB and embed docs.",
       "2. Integrate an Agent Framework.",
       "3. Build pilot for highest-friction workflow."
    ];
    let ry2 = currentY - 35;
    for (const line of fix1Lines) {
       drawText(line, 300, 'F1', 9, 0.28, 0.33, 0.41);
       ry2 -= 12;
    }
    currentY = ty - 40;
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
