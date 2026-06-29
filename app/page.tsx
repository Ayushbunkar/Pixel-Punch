"use client";

import type { Metadata } from "next";
import { ArrowRight, ShieldAlert, Sparkles, Zap, TrendingUp, Cpu, FileText, BarChart3, CheckCircle2, Clock, Network, BrainCircuit, Lock, Mail, Calendar, Phone, Mail as MailIcon, MessageSquare, ChevronDown, ChevronUp, Menu, X, Search, DollarSign, Activity, Layers, Target, Zap as ZapIcon, Lightbulb, BookOpen, Users, Globe, Lock as LockIcon, Unlock, CheckCircle, AlertTriangle, Info, HelpCircle, ChevronRight, Filter, Download, Share2, Settings, MoreHorizontal, Plus, Minus, Trash2, Edit, Copy, Save, Upload, RefreshCw, Play, Pause, SkipForward, SkipBack, Rewind, FastForward, Volume2, VolumeX, Maximize2, Minimize2, Maximize, Minimize } from "lucide-react";
import * as motion from "framer-motion/client";
import { slideUp, staggerContainer, fadeIn } from "@/shared/components/animations";
import { ContactBar } from "@/shared/components/ContactBar";
import { useState } from "react";



// ── FAQ Accordion Item ───────────────────────────────────────────────────────
interface FAQItem {
  question: string;
  answer: string;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    question: "How long does the audit take?",
    answer: "Each audit takes approximately 3 minutes to complete. You'll receive instant RAG scorecards and actionable recommendations upon submission."
  },
  {
    question: "What do I need to prepare?",
    answer: "For the Cost Audit, have your AI tool access details and monthly spend handy. For the Opportunity Audit, be ready to describe your manual workflows and pain points."
  },
  {
    question: "What is a RAG score?",
    answer: "RAG stands for Red-Amber-Green. It's a simple scoring system: Red means action needed, Amber means room to improve, Green means you're doing well."
  },
  {
    question: "Who is this for?",
    answer: "This is for teams and organizations using AI tools who want to optimize costs, find automation opportunities, and build effective AI roadmaps."
  },
  {
    question: "Can I run both audits?",
    answer: "Absolutely! Many organizations run both audits to get a complete picture of their AI optimization and opportunity landscape."
  },
  {
    question: "Is my data secure?",
    answer: "Yes. All audit responses are processed securely. We never share your raw data, and you can download your full report at any time."
  }
];

// ── FAQ Accordion Component ──────────────────────────────────────────────────
function FAQAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 md:py-16">
      <motion.div 
        variants={slideUp} 
        initial="hidden" 
        whileInView="show" 
        viewport={{ once: true }}
        className="text-center mb-10"
      >
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">
          Frequently Asked Questions
        </h2>
        <p className="text-slate-600 text-sm">
          Everything you need to know about our AI Assessment Suite
        </p>
      </motion.div>

      <div className="space-y-3">
        {FAQ_ITEMS.map((item, idx) => (
          <motion.div
            key={idx}
            variants={slideUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            transition={{ delay: idx * 0.05 }}
            className="bg-white rounded-xl border border-slate-200 overflow-hidden"
          >
            <button
              onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
              className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
            >
              <span className="text-sm font-semibold text-slate-900">{item.question}</span>
              {openIndex === idx ? (
                <ChevronUp className="w-4 h-4 text-slate-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-500" />
              )}
            </button>
            <motion.div
              initial={false}
              animate={{ height: openIndex === idx ? "auto" : 0, opacity: openIndex === idx ? 1 : 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="overflow-hidden"
            >
              <div className="px-5 pb-4 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                {item.answer}
              </div>
            </motion.div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ── Results Preview Section ──────────────────────────────────────────────────
function ResultsPreview() {
  return (
    <section className="bg-white border-y border-slate-200">
      <div className="max-w-6xl mx-auto px-4 py-16 md:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: Score Panel */}
          <motion.div 
            variants={slideUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">
                See Your RAG Scorecard
              </h2>
              <p className="text-slate-600 text-sm">
                Get instant visual feedback on your AI stack health with our comprehensive scoring system
              </p>
            </div>

            {/* Score Panel Mockup */}
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Cost Architecture Score</h3>
                <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full">
                  Live Analysis
                </span>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                  { label: "Spend Efficiency", score: "Amber", value: 68, color: "bg-amber-500" },
                  { label: "Model Fit", score: "Red", value: 42, color: "bg-rose-500" },
                  { label: "Architecture", score: "Green", value: 85, color: "bg-emerald-500" },
                ].map((item, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex justify-between items-end">
                      <span className="text-[10px] font-semibold text-slate-700">{item.label}</span>
                      <span className={`text-[9px] font-bold uppercase ${item.score === "Green" ? "text-emerald-600" : item.score === "Amber" ? "text-amber-600" : "text-rose-600"}`}>
                        {item.score}
                      </span>
                    </div>
                    <div className="h-24 bg-slate-200 rounded-lg overflow-hidden relative">
                      <motion.div 
                        initial={{ height: 0 }}
                        whileInView={{ height: `${item.value}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, delay: idx * 0.1 }}
                        className={`absolute bottom-0 w-full ${item.color} opacity-80`}
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] text-slate-500">{item.value}/100</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-[9px] font-bold text-rose-600">!</span>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-slate-900">Critical: Model Overuse Detected</p>
                    <p className="text-[9px] text-slate-600 mt-0.5">Premium models being used for tasks that don't require them</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-slate-900">Good: Cost Monitoring Active</p>
                    <p className="text-[9px] text-slate-600 mt-0.5">Usage tracking is properly configured across all tools</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right: Recommendation Cards */}
          <motion.div 
            variants={slideUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="space-y-4"
          >
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">
                Actionable Recommendations
              </h2>
              <p className="text-slate-600 text-sm">
                Get specific, prioritized recommendations to optimize your AI usage
              </p>
            </div>

            {/* Recommendation Cards */}
            <div className="space-y-3">
              {[
                { 
                  title: "Right-Size Model Selection", 
                  tags: ["Cost", "High Impact"],
                  desc: "Downgrade from GPT-4 to GPT-3.5 for simple classification tasks"
                },
                { 
                  title: "Implement Caching Layer", 
                  tags: ["Efficiency", "Medium Impact"],
                  desc: "Add response caching for repeated queries to reduce token usage"
                },
                { 
                  title: "Consolidate Duplicate Tools", 
                  tags: ["Cost", "High Impact"],
                  desc: "Evaluate overlapping AI tools and consolidate to reduce spend"
                },
                { 
                  title: "Optimize Prompt Engineering", 
                  tags: ["Efficiency", "Medium Impact"],
                  desc: "Refine prompts to reduce unnecessary token consumption"
                }
              ].map((rec, idx) => (
                <motion.div
                  key={idx}
                  variants={slideUp}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-slate-900 mb-2">{rec.title}</h4>
                      <p className="text-[10px] text-slate-600 leading-relaxed">{rec.desc}</p>
                    </div>
                    <div className="flex flex-col gap-1.5 flex-shrink-0">
                      {rec.tags.map((tag, tagIdx) => (
                        <span 
                          key={tagIdx} 
                          className={`text-[9px] font-bold uppercase px-2 py-1 rounded-full ${
                            tag === "Cost" ? "bg-rose-50 text-rose-700 border border-rose-100" :
                            tag === "Efficiency" ? "bg-amber-50 text-amber-700 border border-amber-100" :
                            "bg-emerald-50 text-emerald-700 border border-emerald-100"
                          }`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
              <p className="text-[10px] text-indigo-700 font-semibold">
                This is the type of output you'll receive after completing your audit
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ── How It Works Section ─────────────────────────────────────────────────────
function HowItWorks() {
  return (
    <section className="bg-[#fafbff] py-16 md:py-20">
      <div className="max-w-5xl mx-auto px-4">
        <motion.div 
          variants={slideUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">
            How It Works
          </h2>
          <p className="text-slate-600 text-sm">
            Three simple steps to get your AI optimization insights
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              step: "01",
              title: "Choose Your Audit",
              desc: "Select between Cost Audit or Opportunity Audit based on your needs"
            },
            {
              step: "02",
              title: "Answer Guided Questions",
              desc: "Our wizard walks you through 15-20 targeted questions in 3 minutes"
            },
            {
              step: "03",
              title: "Get Scorecard & Recommendations",
              desc: "Receive instant RAG scores and actionable recommendations"
            }
          ].map((item, idx) => (
            <motion.div
              key={idx}
              variants={slideUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="relative"
            >
              <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center hover:shadow-md transition-shadow">
                <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-indigo-50 flex items-center justify-center border border-indigo-100">
                  <span className="text-lg font-bold text-indigo-600">{item.step}</span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-[10px] text-slate-600 leading-relaxed">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Value Section ────────────────────────────────────────────────────────────
function ValueSection() {
  return (
    <section className="bg-white py-16 md:py-20">
      <div className="max-w-6xl mx-auto px-4">
        <motion.div 
          variants={slideUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">
            Why Use PixelPunch AI Assessment?
          </h2>
          <p className="text-slate-600 text-sm">
            Our diagnostic suite helps you optimize AI spending and uncover automation opportunities
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: <Zap className="w-6 h-6 text-rose-600" />,
              title: "Reduce Waste",
              desc: "Identify and eliminate AI spending leaks before they drain your budget"
            },
            {
              icon: <Lightbulb className="w-6 h-6 text-amber-600" />,
              title: "Find Opportunities",
              desc: "Discover automation opportunities you didn't know existed"
            },
            {
              icon: <Target className="w-6 h-6 text-emerald-600" />,
              title: "Build Roadmap",
              desc: "Get a phased implementation plan with clear priorities"
            }
          ].map((item, idx) => (
            <motion.div
              key={idx}
              variants={slideUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="bg-slate-50 rounded-2xl p-6 border border-slate-200 hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center mb-4 border border-slate-200 shadow-sm">
                {item.icon}
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-2">{item.title}</h3>
              <p className="text-[10px] text-slate-600 leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Audit Cards Section ──────────────────────────────────────────────────────
function AuditCards() {
  return (
    <section className="bg-[#fafbff] py-16 md:py-20">
      <div className="max-w-6xl mx-auto px-4">
        <motion.div 
          variants={slideUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">
            Choose Your Audit Path
          </h2>
          <p className="text-slate-600 text-sm">
            Select the diagnostic that best fits your needs
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Cost Audit Card */}
          <motion.a
            variants={slideUp}
            href="/ai/cost-scan"
            className="group block bg-white rounded-2xl border border-slate-200 p-8 shadow-sm hover:shadow-lg transition-all duration-300 relative overflow-hidden text-left"
          >
            <div className="absolute top-0 right-0 w-48 h-48 bg-rose-500/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
            <div className="w-14 h-14 rounded-xl bg-rose-50 flex items-center justify-center mb-6 border border-rose-100">
              <ShieldAlert className="w-7 h-7 text-rose-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3 group-hover:text-rose-600 transition-colors">
              AI Cost Audit
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed mb-6">
              Is your AI stack burning budget? Find cost leakages, track unit economics anomalies, and identify premium model mismatches.
            </p>

            <ul className="space-y-3 text-xs font-semibold text-slate-500 mb-8">
              <li className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-rose-500" />
                <span>Finds AI spending leaks</span>
              </li>
              <li className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-rose-500" />
                <span>Scores cost architecture risks</span>
              </li>
              <li className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-rose-500" />
                <span>Tailored optimization suggestions</span>
              </li>
            </ul>

            <span className="inline-flex items-center gap-2 text-sm font-bold text-rose-600 group-hover:gap-3 transition-all">
              Run Cost Audit
              <ArrowRight className="w-4 h-4" />
            </span>
          </motion.a>

          {/* Opportunity Audit Card */}
          <motion.a
            variants={slideUp}
            href="/ai/opportunity-scan"
            className="group block bg-white rounded-2xl border border-slate-200 p-8 shadow-sm hover:shadow-lg transition-all duration-300 relative overflow-hidden text-left"
          >
            <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
            <div className="w-14 h-14 rounded-xl bg-indigo-50 flex items-center justify-center mb-6 border border-indigo-100">
              <Sparkles className="w-7 h-7 text-indigo-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3 group-hover:text-indigo-600 transition-colors">
              AI Opportunity Audit
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed mb-6">
              Where can AI automate workflows? Detect manual bottlenecks, calculate feasibility, and draw a phased implementation roadmap.
            </p>

            <ul className="space-y-3 text-xs font-semibold text-slate-500 mb-8">
              <li className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-indigo-500" />
                <span>Finds where AI can be applied</span>
              </li>
              <li className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-500" />
                <span>Scores readiness & business value</span>
              </li>
              <li className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-500" />
                <span>Creates phased AI adoption roadmap</span>
              </li>
            </ul>

            <span className="inline-flex items-center gap-2 text-sm font-bold text-indigo-600 group-hover:gap-3 transition-all">
              Run Opportunity Audit
              <ArrowRight className="w-4 h-4" />
            </span>
          </motion.a>
        </div>
      </div>
    </section>
  );
}

// ── Hero Section ─────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section className="relative py-20 md:py-28 bg-gradient-to-b from-[#fafbff] to-white overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl" />
        <div className="absolute top-20 right-1/4 w-64 h-64 bg-rose-500/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-6xl mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: Content */}
          <motion.div 
            variants={slideUp}
            initial="hidden"
            animate="show"
            className="space-y-6"
          >
            <motion.div 
              variants={slideUp}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-50/50 text-indigo-700 text-xs font-semibold"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
              PixelPunch AI Assessment Suite
            </motion.div>

            <motion.h1 
              variants={slideUp}
              className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 leading-tight"
            >
              Identify AI Waste or Uncover{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-indigo-600">
                New Opportunities
              </span>
            </motion.h1>

            <motion.p 
              variants={slideUp}
              className="text-lg md:text-xl text-slate-600 max-w-xl"
            >
              Select one of our 3-minute diagnostic scans below to assess your current systems, calculate RAG scorecards, and generate actionable recommendations.
            </motion.p>

            <motion.div 
              variants={slideUp}
              className="flex flex-col sm:flex-row gap-4"
            >
              <a
                href="/ai/cost-scan"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all duration-300 shadow-lg shadow-indigo-200 hover:shadow-xl hover:-translate-y-1"
              >
                <ShieldAlert className="w-5 h-5" />
                Start Cost Audit
              </a>
              <a
                href="/ai/opportunity-scan"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 rounded-xl font-bold transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
              >
                <Sparkles className="w-5 h-5" />
                Start Opportunity Audit
              </a>
            </motion.div>

            <motion.p 
              variants={slideUp}
              className="text-xs text-slate-500 pt-4"
            >
              Trusted by teams at <span className="font-semibold text-slate-700">100+</span> organizations worldwide
            </motion.p>
          </motion.div>

          {/* Right: Dashboard Mockup */}
          <motion.div 
            variants={slideUp}
            initial="hidden"
            animate="show"
            className="relative"
          >
            <div className="relative z-10 bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden">
              {/* Mockup Header */}
              <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500" />
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                </div>
                <div className="text-[10px] font-semibold text-slate-500">Dashboard Preview</div>
              </div>

              {/* Mockup Content */}
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: "Total Spend", value: "$12,450", change: "+12%", color: "text-rose-600" },
                    { label: "Efficiency", value: "78%", change: "+5%", color: "text-emerald-600" },
                    { label: "Models", value: "4", change: "0%", color: "text-slate-600" },
                  ].map((item, idx) => (
                    <div key={idx} className="bg-slate-50 rounded-lg p-3">
                      <div className="text-[9px] font-semibold text-slate-500 mb-1">{item.label}</div>
                      <div className="text-lg font-bold text-slate-900">{item.value}</div>
                      <div className={`text-[9px] font-bold ${item.color}`}>{item.change} from last month</div>
                    </div>
                  ))}
                </div>

                <div className="bg-slate-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-xs font-bold text-slate-900">Recent Alerts</div>
                    <span className="text-[9px] font-bold bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full">3 Active</span>
                  </div>
                  <div className="space-y-2">
                    {[
                      { icon: <Zap className="w-3 h-3 text-rose-600" />, text: "Premium model overuse detected" },
                      { icon: <DollarSign className="w-3 h-3 text-amber-600" />, text: "Unusual spend spike in API calls" },
                      { icon: <Activity className="w-3 h-3 text-emerald-600" />, text: "Cost monitoring configured" },
                    ].map((alert, idx) => (
                      <div key={idx} className="flex items-center gap-3 text-[10px] text-slate-600">
                        <div className="w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center flex-shrink-0">
                          {alert.icon}
                        </div>
                        <span>{alert.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Scorecard */}
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -bottom-6 -right-6 md:-right-12 bg-white rounded-xl border border-indigo-100 shadow-xl p-4 z-20"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <div className="text-[9px] font-bold text-slate-900">Overall Score</div>
                  <div className="text-xl font-bold text-indigo-600">72/100</div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ── Header Component ─────────────────────────────────────────────────────────
function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a href="/" className="flex items-center">
            <img src="/logo.jpg" alt="Pixel Punch" className="h-8 w-auto object-contain" />
          </a>



          {/* CTA Button */}
          <div className="hidden md:flex items-center gap-4">
            <a
              href="/ai/cost-scan"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg transition-colors"
            >
              Start Audit
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden py-4 border-t border-slate-200"
          >
            <nav className="flex flex-col gap-4">
              <a
                href="/ai/cost-scan"
                className="px-5 py-3 bg-indigo-600 text-white text-center rounded-lg font-bold"
                onClick={() => setIsMenuOpen(false)}
              >
                Start Audit
              </a>
            </nav>
          </motion.div>
        )}
      </div>
    </header>
  );
}

// ── Final CTA Section ────────────────────────────────────────────────────────
function FinalCTA() {
  return (
    <section className="bg-slate-900 py-16 md:py-20">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <motion.div 
          variants={slideUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="space-y-6"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            Ready to Optimize Your AI Strategy?
          </h2>
          <p className="text-slate-400 text-sm max-w-2xl mx-auto">
            Get instant insights into your AI spending and automation opportunities with our 3-minute diagnostic scans
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
            <a
              href="/ai/cost-scan"
              className="px-8 py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition-all duration-300 shadow-lg shadow-rose-900/30 hover:shadow-xl hover:-translate-y-1"
            >
              Run Cost Audit
            </a>
            <a
              href="/ai/opportunity-scan"
              className="px-8 py-4 bg-white hover:bg-slate-100 text-slate-900 rounded-xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1"
            >
              Run Opportunity Audit
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#fafbff]">
      {/* Contact Bar */}
      <ContactBar containerClassName="max-w-6xl" />

      {/* Header */}
      <Header />

      {/* Hero Section */}
      <Hero />

      {/* Audit Cards */}
      <AuditCards />

      {/* Value Section */}
      <ValueSection />

      {/* How It Works */}
      <HowItWorks />

      {/* Results Preview */}
      <ResultsPreview />

      {/* FAQ */}
      <FAQAccordion />

      {/* Final CTA */}
      <FinalCTA />
    </main>
  );
}