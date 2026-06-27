import type { Metadata } from "next";
import Image from "next/image";
import { ArrowRight, Landmark, Zap, ShieldAlert, Sparkles, TrendingUp, Cpu, FileText } from "lucide-react";
import * as motion from "framer-motion/client";
import { slideUp, staggerContainer, fadeIn } from "@/shared/components/animations";
import { ContactBar } from "@/shared/components/ContactBar";

export const metadata: Metadata = {
  title: "AI Assessment Platform | Pixel Punch AI",
  description:
    "Choose your diagnostic scan. Uncover AI spending leakages with the AI Cost Audit, or map out automation roadmaps with the AI Opportunity Audit.",
};

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#fafbff] bg-page-gradient pb-20">
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
            All AI services
          </a>
        </div>
      </motion.nav>

      <div className="max-w-5xl mx-auto px-4 py-12 md:py-20">
        {/* Hero */}
        <motion.div 
          variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-50px" }}
          className="text-center mb-16"
        >
          <motion.div variants={slideUp} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-50/50 text-indigo-700 text-xs font-semibold mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
            PixelPunch AI Assessment Suite
          </motion.div>

          <motion.h1 variants={slideUp} className="text-4xl md:text-5xl font-black text-slate-900 leading-tight mb-6">
            Identify AI Waste or Uncover{" "}
            <span className="bg-clip-text text-transparent bg-indigo-gradient bg-gradient-to-r from-indigo-600 to-indigo-600">
              New Opportunities
            </span>
          </motion.h1>

          <motion.p variants={slideUp} className="max-w-2xl mx-auto text-lg text-slate-600">
            Select one of our 3-minute diagnostic scans below to assess your current systems, calculate RAG scorecards, and generate recommendations.
          </motion.p>
        </motion.div>

        {/* Portal choices */}
        <motion.div 
          variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto"
        >
          {/* Cost Scan Choice */}
          <motion.a
            variants={slideUp}
            href="/ai/cost-scan"
            className="group block bg-white rounded-2xl border border-slate-200 p-8 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden text-left"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-6 border border-blue-100 text-blue-600">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
              AI Cost Audit
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed mb-6">
              Is your AI stack burning budget? Find cost leakages, track unit economics anomalies, and identify premium model mismatches.
            </p>

            <ul className="space-y-2.5 text-xs font-semibold text-slate-500 mb-8">
              <li className="flex items-center gap-2">
                <Landmark className="w-4 h-4 text-blue-500" />
                Finds AI spending leaks
              </li>
              <li className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-blue-500" />
                Scores cost architecture risks
              </li>
              <li className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-blue-500" />
                Tailored optimization suggestions
              </li>
            </ul>

            <span className="inline-flex items-center gap-1.5 text-sm font-bold text-blue-600 group-hover:gap-2.5 transition-all">
              Run Cost Audit
              <ArrowRight className="w-4 h-4" />
            </span>
          </motion.a>

          {/* Opportunity Scan Choice */}
          <motion.a
            variants={slideUp}
            href="/ai/opportunity-scan"
            className="group block bg-white rounded-2xl border border-slate-200 p-8 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden text-left"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
            <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center mb-6 border border-indigo-100 text-indigo-600">
              <Sparkles className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">
              AI Opportunity Audit
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed mb-6">
              Where can AI automate workflows? Detect manual bottlenecks, calculate feasibility, and draw a phased implementation roadmap.
            </p>

            <ul className="space-y-2.5 text-xs font-semibold text-slate-500 mb-8">
              <li className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-indigo-500" />
                Finds where AI can be applied
              </li>
              <li className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-500" />
                Scores readiness & business value
              </li>
              <li className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-500" />
                Creates phased AI adoption roadmap
              </li>
            </ul>

            <span className="inline-flex items-center gap-1.5 text-sm font-bold text-indigo-600 group-hover:gap-2.5 transition-all">
              Run Opportunity Audit
              <ArrowRight className="w-4 h-4" />
            </span>
          </motion.a>
        </motion.div>
      </div>
    </main>
  );
}
