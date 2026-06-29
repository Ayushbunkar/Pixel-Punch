"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { StoredScanResult } from "@/modules/cost-audit/types";
import { Search, CheckCircle2, Cpu, Activity, Lock, Unlock, AlertCircle } from "lucide-react";
import { ContactBar } from "@/shared/components/ContactBar";
import * as motion from "framer-motion/client";
import { slideUp, staggerContainer, fadeIn } from "@/shared/components/animations";

import { ScoreCard } from "./ScoreCard";
import { InsightsList } from "./InsightsList";
import { TierRecommendation } from "./TierRecommendation";
import { ShareResults } from "./ShareResults";
import { ResultsSkeleton } from "./ResultsSkeleton";
import { EmailModal } from "@/shared/components/EmailModal";

export default function ResultsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const submissionId = searchParams.get("id");

  const [result, setResult] = useState<StoredScanResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);

  useEffect(() => {
    const unlocked = sessionStorage.getItem("cost_report_unlocked") === "true";
    if (unlocked) {
      setIsUnlocked(true);
    }
  }, []);

  const handleUnlock = () => {
    sessionStorage.setItem("cost_report_unlocked", "true");
    setIsUnlocked(true);
  };

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

  if (loading) {
    return <ResultsSkeleton />;
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
          <h2 key={idx} className="text-base font-bold text-slate-900 mt-4 mb-2 border-b border-slate-200 pb-1">
            {parseInlineMarkdown(trimmed.replace(/^#\s+/, ""))}
          </h2>
        );
      }
      if (trimmed.startsWith("### ")) {
        return (
          <h3 key={idx} className="text-sm font-bold text-slate-800 mt-3 mb-1">
            {parseInlineMarkdown(trimmed.replace(/^###\s+/, ""))}
          </h3>
        );
      }
      if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        return (
          <li key={idx} className="text-xs text-slate-600 ml-4 list-disc mb-0.5 leading-relaxed">
            {parseInlineMarkdown(trimmed.replace(/^[-*]\s+/, ""))}
          </li>
        );
      }
      if (trimmed === "---") {
        return <hr key={idx} className="my-3 border-slate-200" />;
      }
      if (trimmed === "") {
        return <div key={idx} className="h-1" />;
      }
      return (
        <p key={idx} className="text-xs text-slate-600 mb-2 leading-relaxed">
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
      <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-md w-full overflow-hidden relative z-10 p-5">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 transition-colors p-1 rounded hover:bg-slate-100"
          aria-label="Close modal"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center mx-auto shadow-sm">
            <Lock className="w-6 h-6" />
          </div>
          
          <div className="space-y-1">
            <h3 className="font-bold text-slate-900 text-lg">Unlock All Insights</h3>
            <p className="text-slate-500 text-xs">
              You've seen the highlights. To view all insights and get the complete AI Cost Audit report:
            </p>
          </div>

          <div className="space-y-2 text-left bg-slate-50 rounded-lg p-3">
            <div className="flex items-start gap-2 text-xs text-slate-600">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
              <span>See all {result.insights.length} insights with full details</span>
            </div>
            <div className="flex items-start gap-2 text-xs text-slate-600">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
              <span>Get the complete technical audit report</span>
            </div>
            <div className="flex items-start gap-2 text-xs text-slate-600">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
              <span>Receive ROI calculation and implementation roadmap</span>
            </div>
          </div>

          <div className="space-y-2">
            <button
              onClick={onEmail}
              className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs transition-colors shadow-sm flex items-center justify-center gap-2"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Email Full Report to My Inbox
            </button>
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-xs transition-colors"
            >
              Continue Browsing
            </button>
          </div>

          <p className="text-[9px] text-slate-400">
            ✓ Secure • Instant Delivery • No Spam
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fafbff] pb-12 overflow-x-hidden">
      {/* Contact Bar */}
      <ContactBar containerClassName="max-w-3xl" />

      {/* Nav Strip */}
      <motion.nav 
        variants={fadeIn} 
        initial="hidden" 
        animate="show"
        className="border-b border-slate-200 px-4 py-3 bg-white/50 backdrop-blur-md"
      >
        <div className="max-w-3xl mx-auto flex items-center justify-between">
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
        className="max-w-3xl mx-auto px-4 py-8 md:py-10 space-y-6"
      >
        {/* ── Header ───────────────────────────────────────────────── */}
        <motion.div variants={slideUp} className="text-center mb-6">
          <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-600 text-[10px] font-semibold mb-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-90 shadow-[0_0_10px_#10b981]"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_8px_#10b981]"></span>
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
          <ScoreCard title="Spend & Visibility" dimension="spend" score={result.scorecard.spend} />
          <ScoreCard title="Architecture & Leakage Risk" dimension="architecture" score={result.scorecard.architecture} />
          <ScoreCard title="Business Pain & Urgency" dimension="pain" score={result.scorecard.pain} />
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
                    {result.costAnalysis?.normalizedData?.provider || "Self-reported Provider"}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1 border-b border-slate-100 pb-1">
                  <span className="text-slate-500 font-medium">Audited Spend Run:</span>
                  <span className="text-indigo-600 font-extrabold text-right truncate">
                    {result.costAnalysis?.normalizedData?.monthlySpend || "No direct billing data"}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1">
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
                          Enter your email to receive key findings, expert cost recommendations, and the complete audit report.
                        </p>
                      </div>
                      <button
                        onClick={() => setEmailModalOpen(true)}
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

        {/* Submission ID (small, for support reference) */}
        <motion.p variants={fadeIn} className="text-center text-[10px] text-slate-400 mt-8">
          Scan ID: {result.submissionId}
        </motion.p>
      </motion.div>

      {/* Unlock Modal */}
      {showUnlockModal && <UnlockModal onClose={() => { setShowUnlockModal(false); localStorage.setItem("cost_scan_unlock_shown", "true"); }} onEmail={() => { setShowUnlockModal(false); setEmailModalOpen(true); }} />}

      {/* Email Modal */}
      {result && (
        <EmailModal
          isOpen={emailModalOpen}
          onClose={() => setEmailModalOpen(false)}
          submissionId={result.submissionId}
          scanType="cost"
          onSuccess={handleUnlock}
        />
      )}
    </div>
  );
}