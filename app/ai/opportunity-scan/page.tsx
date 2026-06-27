import type { Metadata } from "next";
import { Suspense } from "react";
import Image from "next/image";
import { OpportunityWizard } from "@/modules/opportunity-audit/questions/OpportunityWizard";
import { ContactBar } from "@/shared/components/ContactBar";
import { Target, Lightbulb, ClipboardList } from "lucide-react";
import * as motion from "framer-motion/client";
import { slideUp, staggerContainer, fadeIn } from "@/shared/components/animations";

export const metadata: Metadata = {
  title: "AI Opportunity Scan | Pixel Punch AI",
  description:
    "Answer a 3-minute diagnostic and get your personalized AI Opportunity Roadmap. Uncover operational bottlenecks and discover where AI can drive value.",
  openGraph: {
    title: "AI Opportunity Scan — Find where AI can create value",
    description:
      "3-minute diagnostic. Personalized RAG readiness report. Actionable AI roadmap.",
    type: "website",
  },
};

interface PageProps {
  searchParams: Promise<{ ref?: string; utm_source?: string }>;
}

export default async function AiOpportunityScanPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const ref    = params.ref ?? "op-landing";

  return (
    <main className="min-h-screen bg-[#fafbff] bg-page-gradient">
      {/* Contact Bar */}
      <ContactBar containerClassName="max-w-5xl" />

      {/* Nav Strip */}
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
        {/* Hero */}
        <motion.div 
          variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-50px" }}
          className="text-center mb-14"
        >
          {/* Badge */}
          <motion.div variants={slideUp} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-600 text-xs font-semibold mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
            Free · 3-minute diagnostic
          </motion.div>

          <motion.h1 variants={slideUp} className="text-4xl md:text-5xl font-bold text-slate-900 leading-tight mb-4">
            Find where AI can create{" "}
            <span className="bg-clip-text text-transparent bg-indigo-gradient bg-gradient-to-r from-indigo-600 to-violet-600">
              business value
            </span>
            <br className="hidden md:block" /> in 3 minutes
          </motion.h1>

          <motion.p variants={slideUp} className="max-w-2xl mx-auto text-lg text-slate-600 mb-8">
            Assess your data quality, standardize your workflows, and map out a custom AI Roadmap targeting high-impact operational wins.
          </motion.p>

          {/* Value props */}
          <motion.div variants={slideUp} className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-600">
            {[
              { icon: <Target className="w-4 h-4 text-indigo-600" />, text: "AI Readiness score across 3 dimensions" },
              { icon: <Lightbulb className="w-4 h-4 text-indigo-600" />, text: "Tailored AI use case recommendations" },
              { icon: <ClipboardList className="w-4 h-4 text-indigo-600" />, text: "Phased AI adoption roadmap" },
            ].map(({ icon, text }) => (
              <span key={text} className="flex items-center gap-2">
                <span className="flex items-center justify-center">{icon}</span>
                {text}
              </span>
            ))}
          </motion.div>
        </motion.div>

        {/* Wizard */}
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-24">
              <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
            </div>
          }
        >
          <OpportunityWizard initialRef={ref} />
        </Suspense>

        {/* Social Proof */}
        <motion.div 
          variants={fadeIn} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-50px" }}
          className="mt-16 pt-12 border-t border-slate-200 text-center"
        >
          <p className="text-xs text-slate-500 uppercase tracking-widest mb-6 font-semibold">
            Helping teams leverage automation at
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 opacity-60">
            {["Fast-growing Agencies", "SaaS Platforms", "E-commerce Brands", "Enterprise Ops Teams"].map((t) => (
              <span key={t} className="text-sm text-slate-700 font-bold">{t}</span>
            ))}
          </div>
        </motion.div>
      </div>
    </main>
  );
}
