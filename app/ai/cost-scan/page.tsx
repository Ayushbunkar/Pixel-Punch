import type { Metadata } from "next";
import { Suspense } from "react";
import Image from "next/image";
import { CostScanWizard } from "@/modules/cost-audit/questions/CostScanWizard";
import { ContactBar } from "@/shared/components/ContactBar";
import { Target, Lightbulb, ClipboardList } from "lucide-react";
import * as motion from "framer-motion/client";
import { slideUp, staggerContainer, fadeIn } from "@/shared/components/animations";

export const metadata: Metadata = {
  title: "AI Cost Scan | Pixel Punch AI",
  description:
    "Get a personalized AI cost scorecard in 3 minutes. See where your AI spend is leaking — across spend visibility, architecture risk, and business urgency.",
  openGraph: {
    title: "AI Cost Scan — See where your AI spend is leaking",
    description:
      "3 minute diagnostic. Personalized RAG scorecard. Clear next-step recommendation.",
    type: "website",
  },
};

// ── Ref extractor (server component reads search params safely) ────────────
interface PageProps {
  searchParams: Promise<{ ref?: string; utm_source?: string }>;
}

export default async function AiCostScanPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const ref    = params.ref ?? "co-landing";

  return (
    <main className="min-h-screen bg-[#eef4ff] bg-page-gradient">
      {/* ── Top Contact Bar ──────────────────────────────────────────── */}
      <ContactBar containerClassName="max-w-5xl" />

      {/* ── Nav strip ──────────────────────────────────────────────── */}
      <motion.nav 
        variants={fadeIn} initial="hidden" animate="show"
        className="border-b border-slate-200 px-6 py-4 bg-white/50 backdrop-blur-md"
      >
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <a href="/" className="flex items-center hover:opacity-80 transition-opacity">
            <Image src="/logo.jpg" alt="Pixel Punch" width={120} height={36} className="h-9 w-auto object-contain" />
          </a>
          <a
            href="https://pixelpunch.org/services/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            ← All AI services
          </a>
        </div>
      </motion.nav>

      <div className="max-w-5xl mx-auto px-4 py-12 md:py-20">
        {/* ── Hero ───────────────────────────────────────────────── */}
        <motion.div 
          variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-50px" }}
          className="text-center mb-14"
        >
          {/* Badge */}
          <motion.div variants={slideUp} className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 text-xs font-bold mb-6 shadow-sm animate-pulse">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-95 shadow-[0_0_12px_#10b981]"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 shadow-[0_0_10px_#10b981]"></span>
            </span>
            Free · 3 minute diagnostic
          </motion.div>

          <motion.h1 variants={slideUp} className="text-4xl md:text-5xl font-bold text-slate-900 leading-tight mb-4">
            See where your AI spend{" "}
            <span className="bg-clip-text text-transparent bg-accent-gradient">
              is leaking
            </span>
            <br className="hidden md:block" />in 3 minutes
          </motion.h1>

          <motion.p variants={slideUp} className="max-w-2xl mx-auto text-lg text-slate-600 mb-8">
            Answer 7 questions. Get a personalised scorecard across spend visibility,
            architecture risk, and business urgency plus 2 to 3 targeted insights and
            a clear recommendation.
          </motion.p>

          {/* What you get */}
          <motion.div variants={slideUp} className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-600">
            {[
              { icon: <Target className="w-4 h-4" />, text: "RAG scorecard across 3 dimensions" },
              { icon: <Lightbulb className="w-4 h-4" />, text: "2 to 3 tailored insights" },
              { icon: <ClipboardList className="w-4 h-4" />, text: "Clear next-step recommendation" },
            ].map(({ icon, text }) => (
              <span key={text} className="flex items-center gap-2">
                <span className="text-blue-600 flex items-center justify-center">{icon}</span>
                {text}
              </span>
            ))}
          </motion.div>
        </motion.div>

        {/* ── Wizard ─────────────────────────────────────────────── */}
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-24">
              <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
            </div>
          }
        >
          <CostScanWizard initialRef={ref} />
        </Suspense>

        {/* ── Social proof strip ──────────────────────────────────── */}
        <motion.div 
          variants={fadeIn} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-50px" }}
          className="mt-16 pt-12 border-t border-slate-200 text-center"
        >
          <p className="text-xs text-slate-500 uppercase tracking-widest mb-6 font-semibold">
            Built for AI-native teams at
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 opacity-60">
            {["Series A SaaS", "AI-first Startups", "Growth-stage Platforms", "Enterprise AI Teams"].map((t) => (
              <span key={t} className="text-sm text-slate-700 font-bold">{t}</span>
            ))}
          </div>
        </motion.div>
      </div>
    </main>
  );
}
