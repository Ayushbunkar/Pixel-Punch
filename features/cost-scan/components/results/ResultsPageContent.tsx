"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { StoredScanResult } from "@/features/cost-scan/types";
import { Sparkles, Search, CheckCircle, Phone, Mail, MessageCircle } from "lucide-react";
import * as motion from "framer-motion/client";
import { slideUp, staggerContainer, fadeIn } from "@/components/ui/animations";

import { ScoreCard } from "@/features/cost-scan/components/results/ScoreCard";
import { InsightsList } from "@/features/cost-scan/components/results/InsightsList";
import { TierRecommendation } from "@/features/cost-scan/components/results/TierRecommendation";
import { ShareResults } from "@/features/cost-scan/components/results/ShareResults";
import { PdfButton } from "@/features/cost-scan/components/results/PdfButton";
import { ResultsSkeleton } from "@/features/cost-scan/components/results/ResultsSkeleton";

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

  const ctaUrl = result.ctaUrl ?? "https://pixelpunch.org/ai?ref=co-scan-book";

  return (
    <main className="min-h-screen bg-[#eef4ff] bg-page-gradient">
      {/* ── Top Contact Bar ──────────────────────────────────────────── */}
      <div className="bg-[#0d6efd] text-white text-xs py-2 px-6">
        <div className="max-w-3xl mx-auto flex items-center justify-center gap-6">
          <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> +1 (657) 200-1336</span>
          <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> contact@pixelpunch.org</span>
          <span className="flex items-center gap-1.5"><MessageCircle className="w-3.5 h-3.5" /> +1 (657) 200-1336</span>
        </div>
      </div>

      {/* ── Nav ──────────────────────────────────────────────────── */}
      <motion.nav 
        variants={fadeIn} initial="hidden" animate="show"
        className="border-b border-slate-200 px-6 py-4 bg-white/50 backdrop-blur-md"
      >
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 text-lg font-bold text-slate-900 tracking-tight hover:text-blue-600 transition-colors">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <span>Pixel Punch</span>
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
    </main>
  );
}
