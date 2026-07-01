"use client";

import { useEffect, useState, useCallback } from "react";

import Image from "next/image";

import { useRouter, useSearchParams } from "next/navigation";

import { StoredScanResult } from "@/modules/cost-audit/types";

import { Search, CheckCircle2, Cpu, Activity, Lock, Unlock, AlertCircle, Download } from "lucide-react";

import { ContactBar } from "@/shared/components/ContactBar";

import { BarChart3, PieChart, TrendingUp, Target, Zap, Check, AlertTriangle } from "lucide-react";

import * as motion from "framer-motion/client";

import { slideUp, staggerContainer, fadeIn } from "@/shared/components/animations";

import { ScoreCard } from "./ScoreCard";

import { InsightsList } from "./InsightsList";

import { TierRecommendation } from "./TierRecommendation";

import { ShareResults } from "./ShareResults";

import { ResultsSkeleton } from "./ResultsSkeleton";

import { EmailModal } from "@/shared/components/EmailModal";

const cleanMarkdownForPdf = (md: string) => {
  if (!md) return "";
  return md.split("\n").map(line => {
    let trimmed = line.trim();
    // Remove heading markers
    trimmed = trimmed.replace(/^#{1,6}\s+/, "");
    // Remove leading list markers (-, *, •, +)
    trimmed = trimmed.replace(/^([-*+•]\s*)+/, "");
    // Remove numbered list markers
    trimmed = trimmed.replace(/^\d+\.\s+/, "");
    // Remove bold/italic markers
    trimmed = trimmed.replace(/\*\*(.*?)\*\*/g, "$1");
    trimmed = trimmed.replace(/\*(.*?)\*/g, "$1");
    trimmed = trimmed.replace(/__(.*?)__/g, "$1");
    trimmed = trimmed.replace(/_(.*?)_/g, "$1");
    // Remove inline code
    trimmed = trimmed.replace(/`([^`]+)`/g, "$1");
    // Remove markdown links
    trimmed = trimmed.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
    // Remove horizontal rules
    trimmed = trimmed.replace(/^[-*_]{3,}$/, "");
    // Remove any remaining leading/trailing asterisks or hyphens that weren't caught
    trimmed = trimmed.replace(/^[*\-_>]+\s*/, "");
    // Remove standalone asterisks/hyphens left anywhere
    trimmed = trimmed.replace(/\*\*/g, "").replace(/\*/g, "");
    return trimmed;
  }).filter(line => line.trim() !== "---" && line.trim() !== "***" && line.trim() !== "___").join("\n");
};

export default function ResultsPageContent() {

  const router = useRouter();

  const searchParams = useSearchParams();

  const submissionId = searchParams.get("id");

  const [result, setResult] = useState<StoredScanResult | null>(null);

  const [loading, setLoading] = useState(true);

  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [unlockModalOpen, setUnlockModalOpen] = useState(false);

  // Unlock Modal Component
  function UnlockModal({ isOpen, onClose, onEmail }: { isOpen: boolean; onClose: () => void; onEmail: () => void }) {
    if (!isOpen) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
        <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-md w-full overflow-hidden relative z-10 p-5">
          <button onClick={onClose} className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 transition-colors p-1 rounded hover:bg-slate-100" aria-label="Close modal">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          <div className="text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center mx-auto shadow-sm">
              <Lock className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-slate-900 text-lg">Unlock Your Full AI Report</h3>
              <p className="text-slate-500 text-xs">Enter your email below to receive the complete AI Cost Audit report with professional visuals and detailed insights.</p>
            </div>
            <div className="space-y-2 text-left bg-slate-50 rounded-lg p-3">
              <div className="flex items-start gap-2 text-xs text-slate-600"><CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" /><span>Professional PDF report with visual charts</span></div>
              <div className="flex items-start gap-2 text-xs text-slate-600"><CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" /><span>Complete implementation roadmap</span></div>
              <div className="flex items-start gap-2 text-xs text-slate-600"><CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" /><span>Executive summary for stakeholders</span></div>
            </div>
            <div className="space-y-2">
              <button onClick={onEmail} className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs transition-colors shadow-sm flex items-center justify-center gap-2">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>Email Full Report to My Inbox
              </button>
              <button onClick={onClose} className="w-full px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-xs transition-colors">Continue Browsing</button>
            </div>
            <p className="text-[9px] text-slate-400">✓ Secure • Instant Delivery • No Spam</p>
          </div>
        </div>
      </div>
    );
  }

  // Auto-trigger PDF download when ?download=pdf is in URL (from email link)
    const autoDownload = searchParams.get("download") === "pdf";

    // Direct PDF download parameter (from email button link)
    const directPdfDownload = searchParams.get("pdf") === "true";

    // Always unlock report results (no fake blurred content)
    const isUnlocked = false;

  const [dlState, setDlState] = useState<"idle" | "generating" | "done">("idle");

  const triggerPdfDownload = useCallback(async (submId?: string, data?: typeof result) => {
    setDlState("generating");

    // Wait/retry loop for the PDF element to render
    let element = document.getElementById("cost-pdf-report-content") || document.getElementById("pdf-report-content");
    let attempts = 0;
    while (!element && attempts < 6) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      element = document.getElementById("pdf-report-content");
      attempts++;
    }

    if (!element) {
      console.error("PDF element not found after attempts");
      setDlState("idle");
      return;
    }

    try {
      const { default: html2pdf } = await import("html2pdf.js");

      const r = data;
      if (!r) { setDlState("idle"); return; }

      const ragColor = (v: string) => v === "red" ? "#dc2626" : v === "amber" ? "#d97706" : "#16a34a";
      const ragLabel = (v: string) => v === "red" ? "⚠ HIGH RISK" : v === "amber" ? "◑ NEEDS ATTENTION" : "✓ GOOD";
      const ragBg = (v: string) => v === "red" ? "#fee2e2" : v === "amber" ? "#fef3c7" : "#dcfce7";
      const ragText = (v: string) => v === "red" ? "#991b1b" : v === "amber" ? "#b45309" : "#166534";

      const cleanBulletText = (t: string) => {
        if (!t) return "";
        let text = t
          // Remove markdown bold/italic symbols
          .replace(/\*\*(.*?)\*\*/g, "$1")  // **text** -> text
          .replace(/\*(.*?)\*/g, "$1")       // *text* -> text
          .replace(/__(.*?)__/g, "$1")       // __text__ -> text
          .replace(/_(.*?)_/g, "$1")         // _text_ -> text
          // Remove headings
          .replace(/^#{1,6}\s+/gm, "")       // # Heading -> Heading
          // Remove code blocks and inline code
          .replace(/`([^`]+)`/g, "$1")        // `code` -> code
          .replace(/```[\s\S]*?```/g, "")    // code blocks
          // Remove horizontal rules
          .replace(/^-{3,}$/gm, "")           // --- -> empty
          // Remove links [text](url) -> text
          .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
          // Remove leading markdown list markers
          .replace(/^[\s]*[-*•]\s+/gm, "")
          .replace(/^[\s]*\d+\.\s+/gm, "")
          // Clean up remaining markdown symbols
          .replace(/^[#*_`>]+\s*/g, "")
          // Remove multiple newlines
          .replace(/\n{3,}/g, "\n\n")
          // Trim leading/trailing whitespace
          .trim();
        return text;
      };

      // Generate SVG Pie Chart for RAG Scorecard ratings (each slice represents 1/3 since there are 3 scorecard ratings)
      const generatePieChart = (data: { label: string; value: string; color: string }[]) => {
        const size = 100;
        const radius = 35;
        const cx = 50;
        const cy = 50;
        
        // 3 dimensions -> each takes exactly 120 degrees (dasharray calculations on 2 * pi * r ≈ 220)
        // Slice 1: stroke-dasharray="73.3 220" stroke-dashoffset="0"
        // Slice 2: stroke-dasharray="73.3 220" stroke-dashoffset="-73.3"
        // Slice 3: stroke-dasharray="73.3 220" stroke-dashoffset="-146.6"
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

      // Generate SVG Bar Chart for Insights Count
      const generateBarChart = (insightsCount: number, findingsCount: number, recommendationsCount: number) => {
        const width = 280;
        const height = 100;
        const maxCount = Math.max(insightsCount, findingsCount, recommendationsCount, 1);
        const barWidth = 60;
        const gap = 40;
        const chartHeight = 70;
        const startX = 30;
        
        const getBarHeight = (count: number) => (count / maxCount) * chartHeight;
        
        return `
        <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" style="margin: 0 auto;">
          <!-- Y-axis -->
          <line x1="${startX}" y1="10" x2="${startX}" y2="${height - 20}" stroke="#cbd5e1" stroke-width="1"/>
          <!-- X-axis -->
          <line x1="${startX}" y1="${height - 20}" x2="${width - 10}" y2="${height - 20}" stroke="#cbd5e1" stroke-width="1"/>
          
          <!-- Bars -->
          ${[
            { label: "Insights", count: insightsCount, color: "#4f46e5" },
            { label: "Findings", count: findingsCount, color: "#dc2626" },
            { label: "Recs", count: recommendationsCount, color: "#16a34a" }
          ].map((bar, i) => {
            const x = startX + i * (barWidth + gap);
            const barHeight = getBarHeight(bar.count);
            const y = (height - 20) - barHeight;
            return `
            <g>
              <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" fill="${bar.color}" rx="4"/>
              <text x="${x + barWidth/2}" y="${height - 5}" text-anchor="middle" font-size="9" fill="#64748b" font-weight="600">${bar.label}</text>
              <text x="${x + barWidth/2}" y="${y - 5}" text-anchor="middle" font-size="10" fill="#334155" font-weight="bold">${bar.count}</text>
            </g>
            `;
          }).join("")}
        </svg>
        `;
      };

      // Calculate counts for charts
      const insightsCount = r.insights ? r.insights.length : 0;
      const findingsCount = r.findings ? r.findings.length : 0;
      const recommendationsCount = r.recommendations ? r.recommendations.length : 0;

      // Generate scorecard HTML with visual enhancements
      const scorecardHtml = `
        <div style="padding: 32px 40px; background: linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%); border-bottom: 1px solid #e2e8f0; page-break-inside: avoid;">
          <h2 style="font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #64748b; margin: 0 0 20px 0;">RAG Scorecard Overview</h2>
          <table border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td width="48%" valign="middle" style="padding: 16px; background: #fff; border-radius: 12px; border: 1px solid #e2e8f0; text-align: center;">
                ${generatePieChart([
                  { label: "Spend", value: r.scorecard.spend, color: ragColor(r.scorecard.spend) },
                  { label: "Architecture", value: r.scorecard.architecture, color: ragColor(r.scorecard.architecture) },
                  { label: "Pain", value: r.scorecard.pain, color: ragColor(r.scorecard.pain) }
                ])}
                <div style="display: flex; gap: 12px; margin-top: 16px; flex-wrap: wrap; justify-content: center;">
                  <div style="display: flex; align-items: center; gap: 6px; font-size: 10px; color: #64748b;">
                    <span style="width: 10px; height: 10px; background: ${ragColor(r.scorecard.spend)}; border-radius: 2px;"></span>
                    <span>Spend</span>
                  </div>
                  <div style="display: flex; align-items: center; gap: 6px; font-size: 10px; color: #64748b;">
                    <span style="width: 10px; height: 10px; background: ${ragColor(r.scorecard.architecture)}; border-radius: 2px;"></span>
                    <span>Architecture</span>
                  </div>
                  <div style="display: flex; align-items: center; gap: 6px; font-size: 10px; color: #64748b;">
                    <span style="width: 10px; height: 10px; background: ${ragColor(r.scorecard.pain)}; border-radius: 2px;"></span>
                    <span>Pain</span>
                  </div>
                </div>
              </td>
              <td width="4%"></td>
              <td width="48%" valign="top">
                <div style="display: flex; flex-direction: column; gap: 12px;">
                  ${[
                    ["Spend & Visibility", r.scorecard.spend],
                    ["Architecture Risk", r.scorecard.architecture],
                    ["Business Pain & Urgency", r.scorecard.pain]
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
                  `).join("")}
                </div>
              </td>
            </tr>
          </table>
        </div>
      `;

      // Generate insights section with visual enhancements
      const insightsHtml = insightsCount > 0 ? `
        <div style="padding: 28px 40px; border-bottom: 1px solid #e2e8f0; page-break-inside: avoid;">
          <h2 style="font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #64748b; margin: 0 0 16px 0;">Key Insights</h2>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            ${r.insights.slice(0, 8).map((ins: any, i: number) => `
              <div style="background: #f8fafc; border-radius: 8px; border-left: 3px solid #4f46e5; padding: 12px 16px; page-break-inside: avoid;">
                <div style="font-size: 9px; font-weight: 800; color: #4f46e5; margin-bottom: 8px;">Insight ${i + 1}</div>
                <div style="font-size: 11px; color: #334155; line-height: 1.5;">${typeof ins === "string" ? ins : ins.text || ins.title || ""}</div>
              </div>
            `).join("")}
          </div>
        </div>
      ` : "";

      // Generate findings & recommendations section with visual enhancements
      const findingsRecsHtml = (findingsCount > 0 || recommendationsCount > 0) ? `
        <div style="padding: 28px 40px; border-bottom: 1px solid #e2e8f0; page-break-inside: avoid;">
          <h2 style="font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #64748b; margin: 0 0 16px 0;">Analysis Summary</h2>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 20px;">
            ${findingsCount > 0 ? `
            <div style="background: #fff; border-radius: 10px; border: 1px solid #fee2e2; padding: 16px; page-break-inside: avoid;">
              <h3 style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #dc2626; margin: 0 0 12px 0;">⚠ Key Findings (${findingsCount})</h3>
              <div style="display: flex; gap: 8px; margin-bottom: 12px;">
                <div style="flex: 1; background: #fee2e2; border-radius: 4px; height: 8px;">
                  <div style="background: #dc2626; height: 100%; border-radius: 4px; width: ${(findingsCount / Math.max(findingsCount, recommendationsCount, 1)) * 100}%"></div>
                </div>
              </div>
              ${r.findings && r.findings.length > 0 ? r.findings.map((f: string) => `<div style="font-size: 10px; color: #475569; padding: 6px 0; border-bottom: 1px solid #fee2e2; display: flex; gap: 8px;"><span style="color:#dc2626;font-weight:700;">•</span><span>${cleanBulletText(f)}</span></div>`).join("") : ""}
            </div>
            ` : ""}
            ${recommendationsCount > 0 ? `
            <div style="background: #fff; border-radius: 10px; border: 1px solid #dcfce7; padding: 16px; page-break-inside: avoid;">
              <h3 style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #16a34a; margin: 0 0 12px 0;">✓ Recommendations (${recommendationsCount})</h3>
              <div style="display: flex; gap: 8px; margin-bottom: 12px;">
                <div style="flex: 1; background: #dcfce7; border-radius: 4px; height: 8px;">
                  <div style="background: #16a34a; height: 100%; border-radius: 4px; width: ${(recommendationsCount / Math.max(findingsCount, recommendationsCount, 1)) * 100}%"></div>
                </div>
              </div>
              ${r.recommendations && r.recommendations.length > 0 ? r.recommendations.map((rec: string) => `<div style="font-size: 10px; color: #475569; padding: 6px 0; border-bottom: 1px solid #dcfce7; display: flex; gap: 8px;"><span style="color:#16a34a;font-weight:700;">•</span><span>${cleanBulletText(rec)}</span></div>`).join("") : ""}
            </div>
            ` : ""}
          </div>
          ${findingsCount > 0 && recommendationsCount > 0 ? `
          <div style="background: #f8fafc; border-radius: 10px; padding: 16px; text-align: center; page-break-inside: avoid;">
            <h3 style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #64748b; margin: 0 0 12px 0;">Comparison Overview</h3>
            <div style="display: flex; justify-content: center; gap: 24px; flex-wrap: wrap;">
              <div style="text-align: center;">
                <div style="font-size: 24px; font-weight: 900; color: #dc2626;">${findingsCount}</div>
                <div style="font-size: 9px; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">Findings</div>
              </div>
              <div style="text-align: center;">
                <div style="font-size: 24px; font-weight: 900; color: #16a34a;">${recommendationsCount}</div>
                <div style="font-size: 9px; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">Recommendations</div>
              </div>
            </div>
          </div>
          ` : ""}
        </div>
      ` : "";

      // Generate audit report section
      const auditReportHtml = r.auditReport ? `
        <div style="padding: 28px 40px; border-bottom: 1px solid #e2e8f0;">
          <h2 style="font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #64748b; margin: 0 0 16px 0;">Full Technical Audit</h2>
          <div style="font-size: 11px; color: #475569; line-height: 1.7; white-space: pre-wrap; background: #f8fafc; border-radius: 8px; padding: 16px; border: 1px solid #e2e8f0;">${cleanMarkdownForPdf(r.auditReport)}</div>
        </div>
      ` : "";

      // Generate confidence score section if available
      const confidenceHtml = r.confidenceScore ? `
        <div style="padding: 28px 40px; border-bottom: 1px solid #e2e8f0;">
          <h2 style="font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #64748b; margin: 0 0 16px 0;">Audit Confidence Level</h2>
          <div style="display: flex; align-items: center; gap: 20px; flex-wrap: wrap;">
            <div style="flex: 1; min-width: 200px; background: #f8fafc; border-radius: 10px; padding: 20px; text-align: center; border: 1px solid #e2e8f0;">
              <div style="font-size: 32px; font-weight: 900; color: ${Number(r.confidenceScore.replace("%", "")) >= 70 ? "#16a34a" : Number(r.confidenceScore.replace("%", "")) >= 40 ? "#d97706" : "#dc2626"};">${r.confidenceScore}</div>
              <div style="font-size: 10px; color: #64748b; margin-top: 8px; text-transform: uppercase; letter-spacing: 1px;">Confidence Score</div>
            </div>
            <div style="flex: 1; min-width: 200px; background: #f8fafc; border-radius: 10px; padding: 20px; border: 1px solid #e2e8f0;">
              <div style="font-size: 11px; color: #334155; line-height: 1.6;">
                <div style="margin-bottom: 8px; font-weight: 600;">Data Sources:</div>
                <div style="font-size: 10px; color: #64748b;">Questionnaire: ${r.confidenceScore.replace("%", "")}%</div>
                <div style="font-size: 10px; color: #64748b;">Website Data: 0%</div>
                <div style="font-size: 10px; color: #64748b;">Documents: 0%</div>
              </div>
            </div>
          </div>
        </div>
      ` : "";

      const htmlContent = `
        <div style="font-family: 'Segoe UI', system-ui, sans-serif; color: #0f172a; background: #fff; padding: 0; margin: 0;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%); padding: 36px 40px; margin-bottom: 0;">
            <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 16px;">
              <div style="background: rgba(255,255,255,0.15); border-radius: 12px; padding: 10px 16px;">
                <span style="color: #fff; font-size: 18px; font-weight: 900; letter-spacing: -0.5px;">Pixel Punch</span>
              </div>
              <div style="color: rgba(255,255,255,0.6); font-size: 11px; letter-spacing: 2px; text-transform: uppercase; font-weight: 600;">AI Cost Audit</div>
            </div>
            <h1 style="color: #fff; font-size: 26px; font-weight: 800; margin: 0 0 6px 0; line-height: 1.2;">AI Cost Audit Report</h1>
            <p style="color: rgba(255,255,255,0.65); font-size: 12px; margin: 0;">Scan ID: ${r.submissionId} &nbsp;·&nbsp; Generated by Pixel Punch AI</p>
          </div>

          ${scorecardHtml}
 
          <div class="page-break-before">
            ${insightsHtml}
          </div>
 
          <div class="page-break-before">
            ${findingsRecsHtml}
          </div>
 
          <div class="page-break-before">
            ${auditReportHtml}
          </div>
 
          <div class="page-break-before">
            ${confidenceHtml}
          </div>

          <!-- Footer -->
          <div style="padding: 20px 40px; background: #1e1b4b; text-align: center;">
            <p style="color: rgba(255,255,255,0.5); font-size: 10px; margin: 0;">Generated by Pixel Punch AI &nbsp;·&nbsp; pixelpunch.org &nbsp;·&nbsp; © 2026 Pixel Punch. Confidential.</p>
          </div>
        </div>
      `;

      const opt = {
        margin: [10, 10, 10, 10] as [number, number, number, number], // Margins prevent content clipping at edges
        filename: `Pixel-Punch-Cost-Audit-${submId?.slice(0, 8) ?? "report"}.pdf`,
        image: { type: "jpeg" as const, quality: 0.98 },
        html2canvas: { scale: 3, useCORS: true, logging: false, width: 794, windowWidth: 794 },
        jsPDF: { unit: "mm" as const, format: "a4", orientation: "portrait" as const, compress: true },
        pagebreak: { mode: ["css", "legacy"] as const, before: ".page-break-before" },
      };

      await html2pdf().set(opt).from(htmlContent).save();

      setDlState("done");

    } catch (e) {

      console.error("Auto PDF download failed:", e);

      setDlState("idle");

    }

  }, []);


  useEffect(() => {

    async function loadResult() {

      try {

        const stored = sessionStorage.getItem("cost_scan_result");

        if (stored) {

          const parsed: StoredScanResult = JSON.parse(stored);

          if (!submissionId || parsed.submissionId === submissionId) {

            setResult(parsed);

            setLoading(false);

            return;

          }

        }

      } catch {

        // Fall through to API fetch

      }

      if (!submissionId) {

        router.replace("/ai/cost-scan");

        return;

      }

      try {

        const res = await fetch(`/api/cost-scan/result?id=${submissionId}`);

        if (res.ok) {

          const fetchedResult = await res.json();

          setResult(fetchedResult);

        }

      } catch {

        // Fetch error, result remains null

      } finally {

        setLoading(false);

      }

    }

    loadResult();

  }, [submissionId, router]);

  // Trigger PDF download once data is loaded and download param present

  useEffect(() => {

    if (!loading && result && autoDownload) {

      const timer = setTimeout(() => {

        triggerPdfDownload(result.submissionId, result);

      }, 800);

      return () => clearTimeout(timer);

    }

  }, [loading, result, autoDownload, triggerPdfDownload]);

  if (loading) {

    return <ResultsSkeleton />;

  }

  // If coming from email PDF link — show dedicated download screen
  if (autoDownload && result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
          <img src="/logo.jpg" alt="Pixel Punch" className="h-8 w-auto object-contain mx-auto mb-6 opacity-90" />
          {dlState === "done" ? (
            <>
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-white mb-2">PDF Downloaded!</h1>
              <p className="text-slate-400 text-sm mb-6">Your AI Cost Audit report has been saved to your device.</p>
              <div className="flex flex-col gap-2">
                <button onClick={() => triggerPdfDownload(result.submissionId, result)} className="px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white border border-white/20 rounded-lg text-sm font-medium transition-all">⬇ Download Again</button>
                <button onClick={() => window.close()} className="px-4 py-2.5 text-slate-500 text-xs hover:text-slate-400 transition-colors">Close this tab</button>
              </div>
            </>
          ) : (
            <>
              <div className="relative w-16 h-16 mx-auto mb-5">
                <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20" />
                <div className="absolute inset-0 rounded-full border-4 border-t-indigo-400 animate-spin" />
                <div className="absolute inset-2 rounded-full bg-indigo-500/10 flex items-center justify-center">
                  <svg className="w-6 h-6 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
              <h1 className="text-xl font-bold text-white mb-2">{dlState === "generating" ? "Generating your PDF…" : "Preparing your report…"}</h1>
              <p className="text-slate-400 text-sm">{dlState === "generating" ? "Your AI Cost Audit is being compiled. It will download automatically." : "Loading your Cost Audit data…"}</p>
              {dlState === "generating" && (<div className="mt-4 w-full bg-white/5 rounded-full h-1.5"><div className="bg-indigo-400 h-1.5 rounded-full animate-pulse w-3/4" /></div>)}
            </>
          )}
        </div>
        <p className="relative z-10 text-slate-600 text-xs mt-6">Pixel Punch AI · Cost Audit Report</p>
        {/* Hidden full report for html2pdf capture */}
        <div id="cost-pdf-report-content" style={{ position: "absolute", left: "-9999px", top: 0, width: "794px", backgroundColor: "#fff", padding: "32px", fontFamily: "system-ui, sans-serif" }}>
          <div style={{ borderBottom: "2px solid #4f46e5", paddingBottom: "16px", marginBottom: "24px" }}>
            <div style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a" }}>Pixel Punch AI — Cost Audit Report</div>
            <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>ID: {result.submissionId}</div>
          </div>
          <div style={{ marginBottom: "20px" }}>
            <div style={{ fontSize: "14px", fontWeight: "700", color: "#1e293b", marginBottom: "8px" }}>Scorecard</div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
              <thead><tr style={{ backgroundColor: "#f1f5f9" }}><th style={{ padding: "8px 12px", textAlign: "left", color: "#475569" }}>Dimension</th><th style={{ padding: "8px 12px", textAlign: "left", color: "#475569" }}>Rating</th></tr></thead>
              <tbody>
                {([["Spend & Visibility", result.scorecard.spend], ["Architecture Risk", result.scorecard.architecture], ["Business Pain", result.scorecard.pain]] as [string, string][]).map(([label, val]) => (
                  <tr key={label} style={{ borderTop: "1px solid #e2e8f0" }}>
                    <td style={{ padding: "8px 12px", color: "#334155" }}>{label}</td>
                    <td style={{ padding: "8px 12px", fontWeight: "600", color: val === "red" ? "#dc2626" : val === "amber" ? "#d97706" : "#16a34a" }}>{val.toUpperCase()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        {result.insights && result.insights.length > 0 && (
          <div style={{ marginBottom: "20px" }}>
            <div style={{ fontSize: "14px", fontWeight: "700", color: "#1e293b", marginBottom: "8px" }}>Key Insights</div>
            {result.insights.slice(0, 8).map((ins: any, i: number) => (
              <div key={i} style={{ fontSize: "12px", color: "#475569", padding: "4px 0", borderBottom: "1px solid #f1f5f9" }}>{typeof ins === "string" ? ins : ins.text || ins.title}</div>
            ))}
          </div>
        )}
        {result.auditReport && (
          <div style={{ marginBottom: "20px" }}>
            <div style={{ fontSize: "14px", fontWeight: "700", color: "#1e293b", marginBottom: "8px" }}>Full Technical Audit</div>
            <div style={{ fontSize: "11px", color: "#475569", whiteSpace: "pre-wrap", lineHeight: "1.6" }}>{cleanMarkdownForPdf(result.auditReport)}</div>
          </div>
        )}
          <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "12px", fontSize: "10px", color: "#94a3b8", textAlign: "center" }}>Generated by Pixel Punch AI · pixelpunch.org · © 2026 Pixel Punch</div>
        </div>
      </div>
    );
  }

  if (!result) {

    return (

      <div className="min-h-screen bg-[#eef4ff] flex items-center justify-center px-4">

        <motion.div variants={fadeIn} initial="hidden" animate="show" className="glass-card p-6 max-w-md text-center flex flex-col items-center border border-slate-200 shadow-lg">

          <Search className="w-10 h-10 text-slate-400 mb-3" />

          <h2 className="text-lg font-semibold text-slate-900 mb-2">

            Unable to load your AI Cost Scan results.

          </h2>

          <p className="text-slate-600 text-sm mb-4">

            We couldn't find your scan results. Please complete the diagnostic to get your scorecard.

          </p>

          <a href="/ai/cost-scan" className="pp-btn-primary inline-flex">

            Start New Scan

          </a>

        </motion.div>

      </div>

    );

  }

  const ctaUrl = result.ctaUrl ?? "https://pixelpunch.org/contact-us?ref=co-scan-book";

  // ── Simple Markdown to React Element Parser ────────────────────────────────

  const parseInlineMarkdown = (text: string) => {

    const boldParts = text.split(/\*\*([^*]+)\*\*/g);

    return boldParts.map((part, i) => {

      const isBold = i % 2 === 1;

      const italicParts = part.split(/[_*]([^*_]+)[_*]/g);

      const content = italicParts.map((subpart, j) => {

        const isItalic = j % 2 === 1;

        if (isItalic) {

          return <span key={j} className="italic text-slate-800">{subpart}</span>;

        }

        return subpart;

      });

      if (isBold) {

        return <strong key={i} className="text-slate-950 font-bold">{content}</strong>;

      }

      return <span key={i}>{content}</span>;

    });

  };

  const renderMarkdown = (md: string) => {

    return md.split("\n").map((line, idx) => {

      const trimmed = line.trim();

      if (trimmed.startsWith("# ")) {

        return (

          <h2 key={idx} className="text-base font-bold text-slate-900 mt-4 mb-2 border-b border-slate-200 pb-1" style={{ pageBreakInside: "avoid" }}>

            {parseInlineMarkdown(trimmed.replace(/^#\s+/, ""))}

          </h2>

        );

      }

      if (trimmed.startsWith("### ")) {

        return (

          <h3 key={idx} className="text-sm font-bold text-slate-800 mt-3 mb-1" style={{ pageBreakInside: "avoid" }}>

            {parseInlineMarkdown(trimmed.replace(/^###\s+/, ""))}

          </h3>

        );

      }

      if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {

        return (

          <li key={idx} className="text-xs text-slate-600 ml-4 list-disc mb-0.5 leading-relaxed" style={{ pageBreakInside: "avoid" }}>

            {parseInlineMarkdown(trimmed.replace(/^[-*]\s+/, ""))}

          </li>

        );

      }

      if (trimmed === "---") {

        return <hr key={idx} className="my-3 border-slate-200" style={{ pageBreakInside: "avoid" }} />;

      }

      if (trimmed === "") {

        return <div key={idx} className="h-1" style={{ pageBreakInside: "avoid" }} />;

      }

      return (

        <p key={idx} className="text-xs text-slate-600 mb-2 leading-relaxed" style={{ pageBreakInside: "avoid" }}>

          {parseInlineMarkdown(trimmed)}

        </p>

      );

    });

  };

  return (

    <div className="min-h-screen bg-[#fafbff] pb-12 overflow-x-hidden">

      {/* Contact Bar */}

      <ContactBar containerClassName="max-w-4xl" />

      {/* Nav Strip */}

      <motion.nav 

        variants={fadeIn} 

        initial="hidden" 

        animate="show"

        className="border-b border-slate-200 px-4 py-3 bg-white/50 backdrop-blur-md"

      >

        <div className="max-w-4xl mx-auto flex items-center justify-between">

          <a href="/" className="flex items-center hover:opacity-80 transition-opacity">

            <Image src="/logo.jpg" alt="Pixel Punch" width={100} height={30} className="h-7 w-auto object-contain" />

          </a>

          <button

            onClick={() => router.push("/ai/cost-scan")}

            className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"

          >

            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">

              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />

            </svg>

            New Scan

          </button>

        </div>

      </motion.nav>

      {/* Main Content (Unblurred) */}

      <motion.div 

        variants={staggerContainer} initial="hidden" animate="show"

        className="max-w-4xl mx-auto px-4 py-8 md:py-10 space-y-6"

      >

        {/* ── Header ───────────────────────────────────────────────── */}

        <motion.div variants={slideUp} className="text-center mb-6">

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 text-xs font-bold mb-3 shadow-sm animate-pulse">

            <span className="relative flex h-3 w-3">

              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-90 shadow-[0_0_12px_#10b981]"></span>

              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-600 shadow-[0_0_10px_#10b981]"></span>

            </span>

            Scan Status: Live & Complete

          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">

            Your AI Cost Scan Results

          </h1>

          <p className="text-slate-600 text-sm">

            Here is where your AI cost profile currently stands.

          </p>

        </motion.div>

        {/* ── RAG scorecard ────────────────────────────────────────── */}

        <motion.section variants={slideUp} aria-label="Scorecard dimensions" className="mb-6 grid gap-2 md:grid-cols-3">

          <ScoreCard title="Spend & Visibility" dimension="spend" score={isUnlocked ? result.scorecard.spend : "red"} />

          <ScoreCard title="Architecture & Leakage Risk" dimension="architecture" score={isUnlocked ? result.scorecard.architecture : "red"} />

          <ScoreCard title="Business Pain & Urgency" dimension="pain" score={isUnlocked ? result.scorecard.pain : "amber"} />

        </motion.section>

        {/* ── AI Confidence & Cost Audit Metrics Grid ───────────────── */}

        {result.confidenceScore && (

          <motion.div 

            variants={slideUp} 

            whileHover={{ y: -2, borderColor: "#6366f1", boxShadow: "0 8px 15px -5px rgba(99, 102, 241, 0.04)" }}

            className="mb-6 bg-white/80 backdrop-blur-md rounded-xl border border-slate-200 p-3 shadow-sm transition-all duration-300"

          >

            <h2 className="text-[10px] font-bold text-slate-950 uppercase tracking-wider mb-2 flex flex-wrap items-center gap-2">

              <Activity className="w-3 h-3 text-indigo-600 animate-pulse" />

              AI Infrastructure Audit Evidence Verification

            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

              {/* Confidence Indicator */}

              <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-slate-50 border border-slate-200/50">

                <span className="text-[9px] text-slate-500 font-semibold mb-0.5 uppercase tracking-wider">Audit Confidence</span>

                <span className="text-lg font-black text-indigo-600">{result.confidenceScore}</span>

                <span className="text-[8px] uppercase font-bold mt-1 px-1.5 py-0.5 rounded bg-indigo-50 border border-indigo-100 text-indigo-600">

                  {Number(result.confidenceScore.replace("%", "")) >= 70 

                    ? "High Data Depth" 

                    : Number(result.confidenceScore.replace("%", "")) >= 40 

                      ? "Medium Data Depth" 

                      : "Low Data Depth"}

                </span>

              </div>

              

              {/* Cost Evidence summary */}

              <div className="md:col-span-2 space-y-1 text-[10px] flex flex-col justify-center">

                <div className="grid grid-cols-2 gap-1 border-b border-slate-100 pb-1">

                  <span className="text-slate-500 font-medium">Billed Provider:</span>

                  <span className="text-slate-900 font-semibold text-right truncate">

                    {isUnlocked ? (result.costAnalysis?.normalizedData?.provider || "Self-reported Provider") : "AI Systems Detected"}

                  </span>

                </div>

                <div className="grid grid-cols-2 gap-1 border-b border-slate-100 pb-1">

                  <span className="text-slate-500 font-medium">Audited Spend Run:</span>

                  <span className={`font-extrabold text-right truncate ${isUnlocked ? "text-indigo-600" : "text-rose-600"}`}>

                    {isUnlocked ? (result.costAnalysis?.normalizedData?.monthlySpend || "No direct billing data") : "High Leakage Risk"}

                  </span>

                </div>

                <div className="grid grid-cols-2 gap-1">

                  <span className="text-slate-500 font-medium">Identified Waste:</span>

                  <span className={`font-semibold text-right truncate ${isUnlocked ? "text-red-600" : "text-rose-600"}`}>

                    {isUnlocked ? (result.costAnalysis?.normalizedData?.unusedResources || "Unoptimized staging endpoints") : "CRITICAL RISK: Unlock Details"}

                  </span>

                </div>

              </div>

            </div>

          </motion.div>

        )}

        {/* ── Insights ─────────────────────────────────────────────── */}

        <motion.div variants={slideUp}>

          <InsightsList 

            insights={result.insights} 

            onUnlock={() => setEmailModalOpen(true)} 

            isUnlocked={isUnlocked}

          />

        </motion.div>

        {/* ── AI Technical Cost Audit ─────────────────────────────── */}

        {result.auditReport && (

          <motion.div variants={slideUp} className="mb-6 space-y-4">

            <div className="bg-white/80 backdrop-blur-md rounded-xl border border-slate-200 p-3 shadow-sm">

              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2 mb-3">

                <div>

                  <h2 className="text-base font-bold text-slate-950 flex items-center gap-2">

                    <Cpu className="w-4 h-4 text-indigo-600 animate-pulse" />

                    AI Cost Audit & Technical Report

                  </h2>

                  <p className="text-[10px] text-slate-500 mt-0.5">

                    I analyzed the provided technical information to compile these findings.

                  </p>

                </div>

                <span className="text-[9px] font-bold px-2 py-1 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-full uppercase tracking-wider">

                  AI Generated

                </span>

              </div>

              <div className="relative">

                <div className={`flex flex-col gap-3 transition-all duration-500 ${!isUnlocked ? "blur-md select-none pointer-events-none opacity-40" : ""}`}>

                  {/* Top side-by-side Findings & Recommendations */}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">

                    {result.findings && result.findings.length > 0 && (

                      <motion.div 

                        whileHover={{ y: -2, borderColor: "rgba(239, 68, 68, 0.2)", boxShadow: "0 8px 12px -3px rgba(239, 68, 68, 0.03)" }}

                        className="bg-red-50/30 rounded-lg border border-red-500/10 p-3 shadow-sm transition-all duration-300"

                      >

                        <h3 className="text-[10px] font-bold text-red-700 mb-1 flex items-center gap-1.5 uppercase tracking-wider">

                          <AlertCircle className="w-3.5 h-3.5 text-red-500" /> Key Findings

                        </h3>

                        <ul className="space-y-1">

                          {result.findings.map((f, i) => (

                            <motion.li 

                              key={i} 

                              whileHover={{ x: 3 }}

                              className="text-xs text-slate-600 flex items-start gap-1.5 leading-normal transition-all duration-200 cursor-default"

                            >

                              <span className="text-red-500 font-bold">•</span>

                              <span>{f}</span>

                            </motion.li>

                          ))}

                        </ul>

                      </motion.div>

                    )}

                    {result.recommendations && result.recommendations.length > 0 && (

                      <motion.div 

                        whileHover={{ y: -2, borderColor: "rgba(34, 197, 94, 0.2)", boxShadow: "0 8px 12px -3px rgba(34, 197, 94, 0.03)" }}

                        className="bg-green-50/30 rounded-lg border border-green-500/10 p-3 shadow-sm transition-all duration-300"

                      >

                        <h3 className="text-[10px] font-bold text-green-700 mb-1 flex items-center gap-1.5 uppercase tracking-wider">

                          <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> Expert Recommendations

                        </h3>

                        <ul className="space-y-1">

                          {result.recommendations.map((r, i) => (

                            <motion.li 

                              key={i} 

                              whileHover={{ x: 3 }}

                              className="text-xs text-slate-600 flex items-start gap-1.5 leading-normal transition-all duration-200 cursor-default"

                            >

                              <span className="text-green-500 font-bold">•</span>

                              <span>{r}</span>

                            </motion.li>

                          ))}

                        </ul>

                      </motion.div>

                    )}

                  </div>

                  {/* Bottom Full-Width Markdown Report Body */}

                  <div className="bg-slate-50/50 rounded-lg border border-slate-200/60 p-3 overflow-y-auto scrollbar-thin max-h-[300px] min-h-[150px]">

                    {renderMarkdown(result.auditReport)}

                  </div>

                </div>

                {/* Lock Overlay */}
                {!isUnlocked && (
                  <div className="absolute inset-0 bg-slate-50/10 backdrop-blur-[2px] flex flex-col items-center justify-center p-4 text-center rounded-lg border border-slate-200/50 shadow-inner">
                    <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-md max-w-sm flex flex-col items-center space-y-4">
                      <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center border border-indigo-100 text-indigo-600">
                        <Lock className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">Unlock Full Technical Audit Report</h3>
                        <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                          Enter your email below to receive the full AI Cost Audit report, key findings, and expert recommendations directly in your inbox.
                        </p>
                      </div>
                      <button
                        onClick={() => setUnlockModalOpen(true)}
                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs transition-colors shadow-sm flex items-center justify-center gap-1.5"
                      >
                        <Unlock className="w-3.5 h-3.5" />
                        Unlock Report
                      </button>
                    </div>
                  </div>
                )}

              </div>

            </div>

          </motion.div>

        )}

        {/* ── Tier recommendation + CTA ─────────────────────────────── */}

        <motion.div variants={slideUp}>

          <TierRecommendation tier={result.tier} ctaUrl={ctaUrl} />

        </motion.div>

        {/* ── Secondary actions ─────────────────────────────────────── */}

                <motion.div variants={slideUp} className="flex flex-wrap items-center justify-center gap-3 mt-8 pt-6 border-t border-slate-200">

                  <ShareResults />

                  <button

                    onClick={() => setEmailModalOpen(true)}

                    className="inline-flex items-center justify-center px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs transition-all duration-200 shadow-sm gap-2 h-9 min-w-[150px]"

                  >

                    <Cpu className="w-3.5 h-3.5" />

                    Email Audit Report

                  </button>

                </motion.div>

                {/* ── Floating PDF Download Button (visible when unlocked) ── */}

                {isUnlocked && (
                  <div className="fixed bottom-6 right-6 z-50">
                    <button
                      onClick={() => triggerPdfDownload(result.submissionId, result)}
                      className="px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl flex items-center gap-2"
                      title="Download PDF Report"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                  </div>
                )}

                {/* Submission ID (small, for support reference) */}

        <motion.p variants={fadeIn} className="text-center text-[10px] text-slate-400 mt-8">

          Scan ID: {result.submissionId}

        </motion.p>

      </motion.div>

      {/* Unlock Modal */}
      {result && (
        <UnlockModal
          isOpen={unlockModalOpen}
          onClose={() => setUnlockModalOpen(false)}
          onEmail={() => {
            setUnlockModalOpen(false);
            setEmailModalOpen(true);
          }}
        />
      )}

      {/* Hidden PDF Report Content */}
      <div id="cost-pdf-report-content" data-json-data={JSON.stringify(result)} style={{ position: "absolute", left: "-9999px", top: 0, width: "794px", backgroundColor: "#fff", padding: "32px", fontFamily: "system-ui, sans-serif", display: "none" }}>
        <div style={{ borderBottom: "2px solid #4f46e5", paddingBottom: "16px", marginBottom: "24px" }}>
          <div style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a" }}>Pixel Punch AI — Cost Audit Report</div>
          <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>ID: {result.submissionId}</div>
        </div>
        <div style={{ marginBottom: "20px" }}>
          <div style={{ fontSize: "14px", fontWeight: "700", color: "#1e293b", marginBottom: "8px" }}>RAG Scorecard</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
            <thead><tr style={{ backgroundColor: "#f1f5f9" }}><th style={{ padding: "8px 12px", textAlign: "left", color: "#475569" }}>Dimension</th><th style={{ padding: "8px 12px", textAlign: "left", color: "#475569" }}>Rating</th></tr></thead>
            <tbody>
              {([["Spend & Visibility", result.scorecard.spend], ["Architecture Risk", result.scorecard.architecture], ["Business Pain", result.scorecard.pain]] as [string, string][]).map(([label, val]) => (
                <tr key={label} style={{ borderTop: "1px solid #e2e8f0" }}>
                  <td style={{ padding: "8px 12px", color: "#334155" }}>{label}</td>
                  <td style={{ padding: "8px 12px", fontWeight: "600", color: val === "red" ? "#dc2626" : val === "amber" ? "#d97706" : "#16a34a" }}>{val.toUpperCase()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {result.insights && result.insights.length > 0 && (
          <div style={{ marginBottom: "20px" }}>
            <div style={{ fontSize: "14px", fontWeight: "700", color: "#1e293b", marginBottom: "8px" }}>Key Insights</div>
            {result.insights.slice(0, 8).map((ins: any, i: number) => (
              <div key={i} style={{ fontSize: "12px", color: "#475569", padding: "4px 0", borderBottom: "1px solid #f1f5f9" }}>• {typeof ins === "string" ? ins : ins.text || ins.title}</div>
            ))}
          </div>
        )}
        {result.auditReport && (
          <div style={{ marginBottom: "20px" }}>
            <div style={{ fontSize: "14px", fontWeight: "700", color: "#1e293b", marginBottom: "8px" }}>Full Technical Audit</div>
            <div style={{ fontSize: "11px", color: "#475569", whiteSpace: "pre-wrap", lineHeight: "1.6" }}>{result.auditReport}</div>
          </div>
        )}
        <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "12px", fontSize: "10px", color: "#94a3b8", textAlign: "center" }}>Generated by Pixel Punch AI · pixelpunch.org · © 2026 Pixel Punch</div>
      </div>

      {/* Email Modal */}

            {result && (

              <EmailModal
                isOpen={emailModalOpen}
                onClose={() => setEmailModalOpen(false)}
                submissionId={result.submissionId}
                scanType="cost"
                defaultEmail={result.contact.email}
              />
            )}
    </div>
  );

}
