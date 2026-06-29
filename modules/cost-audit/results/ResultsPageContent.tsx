"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { StoredScanResult } from "@/modules/cost-audit/types";
import { Search, CheckCircle, AlertCircle, CheckCircle2, Cpu, Activity, Lock, Unlock } from "lucide-react";
import { ContactBar } from "@/shared/components/ContactBar";
import * as motion from "framer-motion/client";
import { slideUp, staggerContainer, fadeIn } from "@/shared/components/animations";

import { ScoreCard } from "./ScoreCard";
import { InsightsList } from "./InsightsList";
import { TierRecommendation } from "./TierRecommendation";
import { ShareResults } from "./ShareResults";
import { PdfButton } from "./PdfButton";
import { ResultsSkeleton } from "./ResultsSkeleton";
import { PdfReportTemplate } from "./PdfReportTemplate";
import { EmailModal } from "@/shared/components/EmailModal";

export default function ResultsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const submissionId = searchParams.get("id");

  const [result, setResult] = useState<StoredScanResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);

  useEffect(() => {
    async function loadResult() {
      // 1. Check session storage
      try {
        const stored = sessionStorage.getItem("cost_scan_result");
        if (stored) {
          const parsed: StoredScanResult = JSON.parse(stored);
          if (!submissionId || parsed.submissionId === submissionId) {
            setResult(parsed);
            
            // Analytics tracking
            console.log("Analytics: Tracked result_view", { tier: parsed.tier, submissionId: parsed.submissionId });
            
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

      // 2. Fetch from API fallback
      try {
        const res = await fetch(`/api/cost-scan/result?id=${submissionId}`);
        if (res.ok) {
          const fetchedResult = await res.json();
          setResult(fetchedResult);
          
          // Analytics tracking
          console.log("Analytics: Tracked result_view", { tier: fetchedResult.tier, submissionId: fetchedResult.submissionId });
        } else {
          // If not found, result remains null
        }
      } catch {
        // Fetch error, result remains null
      } finally {
        setLoading(false);
      }
    }

    loadResult();
  }, [submissionId, router]);

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) {
    return <ResultsSkeleton />;
  }

  // ── No result state ───────────────────────────────────────────────────────
  if (!result) {
    return (
      <div className="min-h-screen bg-[#eef4ff] flex items-center justify-center px-4">
        <motion.div variants={fadeIn} initial="hidden" animate="show" className="glass-card p-10 max-w-md text-center flex flex-col items-center border border-slate-200 shadow-lg">
          <Search className="w-12 h-12 text-slate-400 mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">
            Unable to load your AI Cost Scan results.
          </h2>
          <p className="text-slate-600 text-sm mb-6">
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
          <h2 key={idx} className="text-lg font-bold text-slate-900 mt-6 mb-3 border-b pb-1.5">
            {parseInlineMarkdown(trimmed.replace(/^#\s+/, ""))}
          </h2>
        );
      }
      if (trimmed.startsWith("### ")) {
        return (
          <h3 key={idx} className="text-sm font-bold text-slate-800 mt-4 mb-2">
            {parseInlineMarkdown(trimmed.replace(/^###\s+/, ""))}
          </h3>
        );
      }
      if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        return (
          <li key={idx} className="text-xs text-slate-600 ml-4 list-disc mb-1 leading-relaxed">
            {parseInlineMarkdown(trimmed.replace(/^[-*]\s+/, ""))}
          </li>
        );
      }
      if (trimmed === "---") {
        return <hr key={idx} className="my-4 border-slate-200" />;
      }
      if (trimmed === "") {
        return <div key={idx} className="h-2" />;
      }
      return (
        <p key={idx} className="text-xs text-slate-600 mb-3 leading-relaxed">
          {parseInlineMarkdown(trimmed)}
        </p>
      );
    });
  };

  // ── Unlock Modal Component ────────────────────────────────────────────────────
  const UnlockModal = ({ onClose, onEmail }: { onClose: () => void; onEmail: () => void }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Box */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full overflow-hidden relative z-10 p-6 md:p-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded-full hover:bg-slate-100"
          aria-label="Close modal"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center mx-auto shadow-sm">
            <Lock className="w-8 h-8" />
          </div>
          
          <div className="space-y-2">
            <h3 className="font-bold text-slate-900 text-xl">Unlock All Insights</h3>
            <p className="text-slate-500 text-sm">
              You've seen the highlights. To view all insights and get the complete AI Cost Audit report:
            </p>
          </div>

          <div className="space-y-3 text-left bg-slate-50 rounded-xl p-4">
            <div className="flex items-start gap-2 text-xs text-slate-600">
              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
              <span>See all {result.insights.length} insights with full details</span>
            </div>
            <div className="flex items-start gap-2 text-xs text-slate-600">
              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
              <span>Get the complete technical audit report</span>
            </div>
            <div className="flex items-start gap-2 text-xs text-slate-600">
              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
              <span>Receive ROI calculation and implementation roadmap</span>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={onEmail}
              className="w-full px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-sm transition-colors shadow-sm flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Email Full Report to My Inbox
            </button>
            <button
              onClick={onClose}
              className="w-full px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-sm transition-colors"
            >
              Continue Browsing
            </button>
          </div>

          <p className="text-[10px] text-slate-400">
            ✓ Secure • Instant Delivery • No Spam
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <main className="min-h-screen bg-[#eef4ff] bg-page-gradient">
      {/* ── Top Contact Bar ──────────────────────────────────────────── */}
      <ContactBar containerClassName="max-w-3xl" />

      {/* ── Nav ──────────────────────────────────────────────────── */}
      <motion.nav 
        variants={fadeIn} initial="hidden" animate="show"
        className="border-b border-slate-200 px-6 py-4 bg-white/50 backdrop-blur-md"
      >
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <a href="/" className="flex items-center hover:opacity-80 transition-opacity">
            <Image src="/logo.jpg" alt="Pixel Punch" width={120} height={36} className="h-9 w-auto object-contain" />
          </a>
          <a href="/ai/cost-scan" className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">
            ← Retake scan
          </a>
        </div>
      </motion.nav>

      <motion.div 
        variants={staggerContainer} initial="hidden" animate="show"
        className="max-w-3xl mx-auto px-4 py-12 md:py-20"
      >
        {/* ── Header ───────────────────────────────────────────────── */}
        <motion.div variants={slideUp} className="text-center mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-600 text-xs font-semibold mb-4">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-90 shadow-[0_0_10px_#10b981]"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 shadow-[0_0_8px_#10b981]"></span>
            </span>
            Scan Status: Live & Complete
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
            Your AI Cost Scan Results
          </h1>
          <p className="text-slate-600">
            Here is where your AI cost profile currently stands.
          </p>
        </motion.div>

        {/* ── RAG scorecard ────────────────────────────────────────── */}
        <motion.section variants={slideUp} aria-label="Scorecard dimensions" className="mb-8 grid gap-4 md:grid-cols-3">
          <ScoreCard title="Spend & Visibility" dimension="spend" score={result.scorecard.spend} />
          <ScoreCard title="Architecture & Leakage Risk" dimension="architecture" score={result.scorecard.architecture} />
          <ScoreCard title="Business Pain & Urgency" dimension="pain" score={result.scorecard.pain} />
        </motion.section>

        {/* ── AI Confidence & Cost Audit Metrics Grid ───────────────── */}
        {result.confidenceScore && (
          <motion.div 
            variants={slideUp} 
            whileHover={{ y: -4, borderColor: "#6366f1", boxShadow: "0 10px 20px -5px rgba(99, 102, 241, 0.04)" }}
            className="mb-8 bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200 p-6 shadow-sm transition-all duration-300"
          >
            <h2 className="text-xs font-bold text-slate-950 uppercase tracking-wider mb-4 flex flex-wrap items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-600 animate-pulse" />
              AI Infrastructure Audit Evidence Verification
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Confidence Indicator */}
              <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-50 border border-slate-200/50">
                <span className="text-[10px] text-slate-500 font-semibold mb-1 uppercase tracking-wider">Audit Confidence</span>
                <span className="text-3xl font-black text-indigo-600">{result.confidenceScore}</span>
                <span className="text-[9px] uppercase font-bold mt-2 px-2 py-0.5 rounded bg-indigo-50 border border-indigo-100 text-indigo-600">
                  {Number(result.confidenceScore.replace("%", "")) >= 70 
                    ? "High Data Depth" 
                    : Number(result.confidenceScore.replace("%", "")) >= 40 
                      ? "Medium Data Depth" 
                      : "Low Data Depth"}
                </span>
              </div>
              
              {/* Cost Evidence summary */}
              <div className="md:col-span-2 space-y-2 text-xs flex flex-col justify-center">
                <div className="grid grid-cols-2 gap-2 border-b border-slate-100 pb-2">
                  <span className="text-slate-500 font-medium">Billed Provider:</span>
                  <span className="text-slate-900 font-semibold text-right">
                    {result.costAnalysis?.normalizedData?.provider || "Self-reported Provider"}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 border-b border-slate-100 pb-2">
                  <span className="text-slate-500 font-medium">Audited Spend Run:</span>
                  <span className="text-indigo-600 font-extrabold text-right">
                    {result.costAnalysis?.normalizedData?.monthlySpend || "No direct billing data"}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 pb-1">
                  <span className="text-slate-500 font-medium">Identified Waste:</span>
                  <span className="text-red-600 font-semibold text-right truncate" title={result.costAnalysis?.normalizedData?.unusedResources}>
                    {result.costAnalysis?.normalizedData?.unusedResources || "Unoptimized staging endpoints"}
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
            onUnlock={() => setShowUnlockModal(true)} 
          />
        </motion.div>

        {/* ── AI Technical Cost Audit ─────────────────────────────── */}
        {result.auditReport && (
          <motion.div variants={slideUp} className="mb-8 space-y-6">
            <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-950 flex items-center gap-2">
                    <Cpu className="w-5 h-5 text-indigo-600 animate-pulse" />
                    AI Cost Audit & Technical Report
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    I analyzed the provided technical information to compile these findings.
                  </p>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-full uppercase tracking-wider">
                  AI Generated
                </span>
              </div>

              <div className="flex flex-col gap-6">
                {/* Top side-by-side Findings & Recommendations */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {result.findings && result.findings.length > 0 && (
                    <motion.div 
                      whileHover={{ y: -3, borderColor: "rgba(239, 68, 68, 0.2)", boxShadow: "0 10px 15px -3px rgba(239, 68, 68, 0.03)" }}
                      className="bg-red-50/30 rounded-xl border border-red-500/10 p-5 shadow-sm transition-all duration-300"
                    >
                      <h3 className="text-xs font-bold text-red-700 mb-3 flex items-center gap-1.5 uppercase tracking-wider">
                        <AlertCircle className="w-4 h-4 text-red-500" /> Key Findings
                      </h3>
                      <ul className="space-y-2">
                        {result.findings.map((f, i) => (
                          <motion.li 
                            key={i} 
                            whileHover={{ x: 4 }}
                            className="text-xs text-slate-650 flex items-start gap-1.5 leading-normal transition-all duration-200 cursor-default"
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
                      whileHover={{ y: -3, borderColor: "rgba(34, 197, 94, 0.2)", boxShadow: "0 10px 15px -3px rgba(34, 197, 94, 0.03)" }}
                      className="bg-green-50/30 rounded-xl border border-green-500/10 p-5 shadow-sm transition-all duration-300"
                    >
                      <h3 className="text-xs font-bold text-green-700 mb-3 flex items-center gap-1.5 uppercase tracking-wider">
                        <CheckCircle2 className="w-4 h-4 text-green-500" /> Expert Recommendations
                      </h3>
                      <ul className="space-y-2">
                        {result.recommendations.map((r, i) => (
                          <motion.li 
                            key={i} 
                            whileHover={{ x: 4 }}
                            className="text-xs text-slate-650 flex items-start gap-1.5 leading-normal transition-all duration-200 cursor-default"
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
                <div className="bg-slate-50/50 rounded-xl border border-slate-200/60 p-6 overflow-y-auto scrollbar-thin max-h-[550px] min-h-[300px]">
                  {renderMarkdown(result.auditReport)}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Tier recommendation + CTA ─────────────────────────────── */}
        <motion.div variants={slideUp}>
          <TierRecommendation tier={result.tier} ctaUrl={ctaUrl} />
        </motion.div>

        {/* ── Secondary actions ─────────────────────────────────────── */}
        <motion.div variants={slideUp} className="flex flex-wrap items-center justify-center gap-4 mt-12 pt-8 border-t border-slate-200">
          <ShareResults />
          <button
            onClick={() => setEmailModalOpen(true)}
            className="inline-flex items-center justify-center px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-sm transition-all duration-200 shadow-sm gap-2"
          >
            <Cpu className="w-4 h-4" />
            Email Audit Report
          </button>
        </motion.div>

        {/* Submission ID (small, for support reference) */}
        <motion.p variants={fadeIn} className="text-center text-xs text-slate-400 mt-12">
          Scan ID: {result.submissionId}
        </motion.p>
      </motion.div>

      {/* Unlock Modal */}
      {showUnlockModal && <UnlockModal onClose={() => setShowUnlockModal(false)} onEmail={() => { setShowUnlockModal(false); setEmailModalOpen(true); }} />}

      {/* Email Modal */}
      {result && (
        <EmailModal
          isOpen={emailModalOpen}
          onClose={() => setEmailModalOpen(false)}
          submissionId={result.submissionId}
          scanType="cost"
        />
      )}
    </main>
  );
}