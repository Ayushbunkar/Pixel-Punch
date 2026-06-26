"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { StoredScanResult } from "@/features/cost-scan/types";
import { Search, CheckCircle, AlertCircle, CheckCircle2, Cpu } from "lucide-react";
import { ContactBar } from "@/components/ui/ContactBar";
import * as motion from "framer-motion/client";
import { slideUp, staggerContainer, fadeIn } from "@/components/ui/animations";

import { ScoreCard } from "@/features/cost-scan/components/results/ScoreCard";
import { InsightsList } from "@/features/cost-scan/components/results/InsightsList";
import { TierRecommendation } from "@/features/cost-scan/components/results/TierRecommendation";
import { ShareResults } from "@/features/cost-scan/components/results/ShareResults";
import { PdfButton } from "@/features/cost-scan/components/results/PdfButton";
import { ResultsSkeleton } from "@/features/cost-scan/components/results/ResultsSkeleton";
import { PdfReportTemplate } from "@/features/cost-scan/components/results/PdfReportTemplate";

export default function ResultsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const submissionId = searchParams.get("id");

  const [result, setResult] = useState<StoredScanResult | null>(null);
  const [loading, setLoading] = useState(true);

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
            We couldn&apos;t find your scan results. Please complete the diagnostic to get your scorecard.
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
  const renderMarkdown = (md: string) => {
    return md.split("\n").map((line, idx) => {
      const trimmed = line.trim();
      if (trimmed.startsWith("# ")) {
        return (
          <h2 key={idx} className="text-lg font-bold text-slate-900 mt-6 mb-3 border-b pb-1.5">
            {trimmed.replace(/^#\s+/, "")}
          </h2>
        );
      }
      if (trimmed.startsWith("### ")) {
        return (
          <h3 key={idx} className="text-sm font-bold text-slate-800 mt-4 mb-2">
            {trimmed.replace(/^###\s+/, "")}
          </h3>
        );
      }
      if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        return (
          <li key={idx} className="text-xs text-slate-600 ml-4 list-disc mb-1 leading-relaxed">
            {trimmed.replace(/^[-*]\s+/, "")}
          </li>
        );
      }
      if (trimmed === "---") {
        return <hr key={idx} className="my-4 border-slate-200" />;
      }
      if (trimmed === "") {
        return <div key={idx} className="h-2" />;
      }
      const parts = trimmed.split(/\*\*([^*]+)\*\*/g);
      return (
        <p key={idx} className="text-xs text-slate-600 mb-3 leading-relaxed">
          {parts.map((part, i) => (i % 2 === 1 ? <strong key={i} className="text-slate-900 font-semibold">{part}</strong> : part))}
        </p>
      );
    });
  };

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
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-600 text-xs font-medium mb-4">
            <CheckCircle className="w-4 h-4" /> Scan complete
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

        {/* ── Insights ─────────────────────────────────────────────── */}
        <motion.div variants={slideUp}>
          <InsightsList insights={result.insights} />
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

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Markdown Report Body */}
                <div className="lg:col-span-2 bg-slate-50/50 rounded-xl border border-slate-200/60 p-6 max-h-[500px] overflow-y-auto scrollbar-thin">
                  {renderMarkdown(result.auditReport)}
                </div>

                {/* Sidebar Findings/Recs */}
                <div className="space-y-4">
                  {result.findings && result.findings.length > 0 && (
                    <div className="bg-red-50/30 rounded-xl border border-red-500/10 p-5 shadow-sm">
                      <h3 className="text-xs font-bold text-red-700 mb-3 flex items-center gap-1.5 uppercase tracking-wider">
                        <AlertCircle className="w-4 h-4 text-red-500" /> Key Findings
                      </h3>
                      <ul className="space-y-2">
                        {result.findings.map((f, i) => (
                          <li key={i} className="text-xs text-slate-600 flex items-start gap-1.5 leading-normal">
                            <span className="text-red-500 font-bold">•</span>
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {result.recommendations && result.recommendations.length > 0 && (
                    <div className="bg-green-50/30 rounded-xl border border-green-500/10 p-5 shadow-sm">
                      <h3 className="text-xs font-bold text-green-700 mb-3 flex items-center gap-1.5 uppercase tracking-wider">
                        <CheckCircle2 className="w-4 h-4 text-green-500" /> Expert Recommendations
                      </h3>
                      <ul className="space-y-2">
                        {result.recommendations.map((r, i) => (
                          <li key={i} className="text-xs text-slate-600 flex items-start gap-1.5 leading-normal">
                            <span className="text-green-500 font-bold">•</span>
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
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
          <PdfButton submissionId={result.submissionId} />
        </motion.div>

        {/* Submission ID (small, for support reference) */}
        <motion.p variants={fadeIn} className="text-center text-xs text-slate-400 mt-12">
          Scan ID: {result.submissionId}
        </motion.p>
      </motion.div>

      {/* ── Hidden PDF Template ── */}
      {/* Positioned completely off-screen so it doesn't affect the visible layout, but remains in the DOM for html2pdf to capture */}
      <div style={{ position: "absolute", top: "-9999px", left: "-9999px" }}>
        <PdfReportTemplate result={result} />
      </div>
    </main>
  );
}
