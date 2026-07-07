import { ReportData, renderReportToHtml } from "./report-content-generator";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium-min";
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

export async function generatePdf(data: ReportData): Promise<Buffer> {
  const logoBase64 = data.logoBase64 || "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wgARCAIyBQADASIAAREBAxEB/8QAGwABAAIDAQEA";
  
  // Determine executable path and args for chromium based on serverless vs local environment
  let executablePath = process.env.PUPPETEER_EXECUTABLE_PATH; // Use directly if set
  let launchArgs = ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"];
  
  const os = require("os");

  console.log(`[pdf-generator] NODE_ENV: ${process.env.NODE_ENV}, VERCEL: ${process.env.VERCEL}, OS Platform: ${os.platform()}, PUPPETEER_EXECUTABLE_PATH: ${process.env.PUPPETEER_EXECUTABLE_PATH}`);
  console.log(`[pdf-generator] puppeteer-core version: ${require('puppeteer-core/package.json').version}`);

  if (!executablePath) { // If PUPPETEER_EXECUTABLE_PATH is not set
    try {
      // Always try to use chromium.executablePath() if PUPPETEER_EXECUTABLE_PATH is not explicitly set
      executablePath = await chromium.executablePath();
      launchArgs = [...chromium.args, "--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"];
    } catch (e) {
      console.error("[pdf-generator] chromium.executablePath() failed. This is critical for PDF generation. Please ensure @sparticuz/chromium-min is correctly installed and configured, or set PUPPETEER_EXECUTABLE_PATH.");
      throw new Error("Failed to find Chromium executable for PDF generation.");
    }
  }

  if (!executablePath || !fs.existsSync(executablePath)) {
    console.error(`[pdf-generator] Chromium executable not found at: ${executablePath}. Please ensure the path is correct or @sparticuz/chromium-min is properly configured.`);
    throw new Error(`Chromium executable not found at ${executablePath}`);
  }

  console.log(`[pdf-generator] Using executablePath: ${executablePath}`);

  let browser;
  try {
    browser = await puppeteer.launch({
      args: launchArgs,
      executablePath,
      headless: true,
    });

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
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[pdf-generator] Error launching Puppeteer or generating PDF: ${errorMessage}`);
    throw new Error(`Failed to generate PDF: ${errorMessage}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
