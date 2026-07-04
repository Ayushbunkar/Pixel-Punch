"use client";

import { useEffect, useState } from "react";

import { useRouter, useSearchParams } from "next/navigation";

import { StoredScanResult } from "@/modules/cost-audit/types";

import { CheckCircle2, Cpu, Lock, Unlock, Download } from "lucide-react";

import { ContactBar } from "@/shared/components/ContactBar";

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
    trimmed = trimmed.replace(/^[*-_>]+\s*/, "");
    // Remove standalone asterisks/hyphens left anywhere
    trimmed = trimmed.replace(/\*\*/g, "").replace(/\*/g, "");
    return trimmed;
  }).filter(line => line.trim() !== "---" && line.trim() !== "***" && line.trim() !== "___").join("\n");
};

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
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center mx-auto shadow-sm">
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
            <button onClick={onEmail} className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs transition-colors shadow-sm flex items-center justify-center gap-2">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>Email Full Report to My Inbox
            </button>
            <button onClick={onClose} className="w-full px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-xs transition-colors">Continue Browsing</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResultsPageContent() {

  const router = useRouter();

  const searchParams = useSearchParams();

  const submissionId = searchParams.get("id");

  const [result, setResult] = useState<StoredScanResult | null>(null);

  const [loading, setLoading] = useState(true);

  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [unlockModalOpen, setUnlockModalOpen] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);

  const triggerPdfDownload = (submissionId: string, _result: StoredScanResult) => {
    console.log('Download PDF triggered');
    // Actual PDF download logic will go here
  };

  const renderMarkdown = (markdown?: string) => {
    // Basic markdown rendering for now
    return <p>{markdown ?? ""}</p>;
  };

  useEffect(() => {
    const fetchResult = async () => {
      if (!submissionId) {
        router.push("/ai/cost-scan");
        return;
      }
      try {
        setLoading(true);
        const res = await fetch(`/api/cost-scan/results?id=${submissionId}`);
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const data: StoredScanResult = await res.json();
        setResult(data);
        if (data.contact.email) {
          setIsUnlocked(true);
        }
      } catch (error) {
        console.error("Failed to fetch scan result:", error);
        // Handle error, maybe redirect to an error page or show a message
      } finally {
        setLoading(false);
      }
    };
    fetchResult();
  }, [submissionId, router]);

  const ctaUrl = result?.scorecard.spend === "red" ? "/solutions/cost-optimization" : "/contact";

  return (
    <div className="relative isolate pt-14">
      <ContactBar />
      <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
        {loading ? (
          <ResultsSkeleton />
        ) : !result ? (
          <div className="text-center text-red-600">Error: Result not found or failed to load.</div>
        ) : (
          <motion.div
            initial="hidden"
            animate="show"
            viewport={{ once: false, amount: 0.25 }}
            variants={staggerContainer}
          >
            <div className="flex flex-col lg:flex-row gap-8">

              {/* Left Column - Scorecard and Insights */}
              <motion.div variants={fadeIn} className="lg:w-1/3 space-y-6">
                <ScoreCard
                  title="Spend & Visibility"
                  dimension="spend"
                  score={result.scorecard.spend}
                />
                <ScoreCard
                  title="Architecture Risk"
                  dimension="architecture"
                  score={result.scorecard.architecture}
                />
                <ScoreCard
                  title="Business Pain"
                  dimension="pain"
                  score={result.scorecard.pain}
                />
                <InsightsList insights={result.insights} />
              </motion.div>
//gd
              {/* Right Column - Audit Report */}
              <div className="lg:w-2/3 space-y-6 relative">
                <motion.div
                  variants={fadeIn}
                  className="bg-white rounded-lg border border-slate-200 shadow-lg p-6 relative"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      <Cpu className="w-5 h-5 text-blue-600" /> AI Cost Audit Report
                    </h2>
                    {!isUnlocked && (
                      <button
                        onClick={() => setUnlockModalOpen(true)}
                        className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 text-sm font-semibold transition-colors"
                      >
                        <Lock className="w-4 h-4" /> Unlock Report
                      </button>
                    )}
                  </div>

                  <div className="border border-slate-200 rounded-lg overflow-hidden relative">

                    {/* Top Markdown Report Body */}
                    <div className="bg-white p-3 overflow-y-auto scrollbar-thin max-h-[300px] min-h-[150px]">
                      {renderMarkdown(result.auditReport)}
                    </div>

                    {/* Lock Overlay */}
                    {!isUnlocked && (
                      <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] flex flex-col items-center justify-center p-4 text-center rounded-lg border border-slate-200/50 shadow-inner">
                        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-md max-w-sm flex flex-col items-center space-y-4">
                          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100 text-blue-600">
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
                            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs transition-colors shadow-sm flex items-center justify-center gap-1.5"
                          >
                            <Unlock className="w-3.5 h-3.5" />
                            Unlock Report
                          </button>
                        </div>
                      </div>
                    )}

                  </div>

                </motion.div>

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

                {/* Bottom Full-Width Markdown Report Body */}

                <div className="bg-slate-50/50 rounded-lg border border-slate-200/60 p-3 overflow-y-auto scrollbar-thin max-h-[300px] min-h-[150px]">

                  {renderMarkdown(result.auditReport)}

                </div>

              </div>

            </div>

            {/* ── Tier recommendation + CTA ─────────────────────────────── */}

            <motion.div variants={slideUp}>

              <TierRecommendation tier={result.tier} ctaUrl={ctaUrl} />

            </motion.div>

            {/* ── Secondary actions ─────────────────────────────────────── */}

            <motion.div variants={slideUp} className="flex flex-wrap items-center justify-center gap-3 mt-8 pt-6 border-t border-slate-200">

              <ShareResults />

              <button

                onClick={() => setEmailModalOpen(true)}

                className="inline-flex items-center justify-center px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs transition-all duration-200 shadow-sm gap-2 h-9 min-w-[150px]"

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
                  className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl flex items-center gap-2"
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
        )}

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
        {result && (
          <div id="cost-pdf-report-content" data-json-data={JSON.stringify(result)} style={{ position: "absolute", left: "-9999px", top: 0, width: "794px", backgroundColor: "#fff", padding: "32px", fontFamily: "system-ui, sans-serif", display: "none" }}>
            <div style={{ borderBottom: "2px solid #2563eb", paddingBottom: "16px", marginBottom: "24px" }}>
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
                {result.insights.slice(0, 8).map((ins, i: number) => (
                  <div key={i} style={{ fontSize: "12px", color: "#475569", padding: "4px 0", borderBottom: "1px solid #f1f5f9" }}>• {ins}</div>
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
        )}

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
    </div>
  );

}