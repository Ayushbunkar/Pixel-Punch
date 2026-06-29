"use client";

import { useSearchParams, useRouter } from "next/navigation";

import { useEffect, useState, useCallback } from "react";

import Image from "next/image";

import { ContactBar } from "@/shared/components/ContactBar";

import { 

  CheckCircle2, ShieldCheck, ArrowLeft, Clock, Calendar, 

  Network, Sparkles, AlertCircle, LineChart, BrainCircuit, 

  Mail, Lock, Unlock

} from "lucide-react";

import toast from "react-hot-toast";

import * as motion from "framer-motion/client";

import { slideUp, staggerContainer, fadeIn } from "@/shared/components/animations";

import { EmailModal } from "@/shared/components/EmailModal";

type Rag = "red" | "amber" | "green";

interface ResultsData {

  submissionId: string;

  scorecard: {

    readiness: Rag;

    value:     Rag;

    opportunity: Rag;

  };

  tier: 1 | 2 | 3 | 4;

  recommendations: string[];

  aiRecommendations?: {

    opportunity: string;

    problem: string;

    impact: string;

    complexity: "Low" | "Medium" | "High";

    priority: "Low" | "Medium" | "High";

  }[];

  roadmap: {

    phase1: string[];

    phase2: string[];

    phase3: string[];

  };

  createdDate: string;

  auditStatus: string;

  company: {

    name: string;

    industry: string;

    size: string;

    businessType: string;

  };

  contact: {

    firstname: string;

    lastname: string;

    email: string;

    job_title: string;

  };

  score?: {

    readiness?: Rag;

    value?:     Rag;

    opportunity?: Rag;

    categories?: Record<string, {

      name: string;

      score: number;

      maxScore: number;

      classification: "low" | "medium" | "high";

      description: string;

    }>;

  };

  auditReport?: string;

  findings?: string[];

  nextSteps?: string[];

}

const RAG_STYLES: Record<Rag, { bg: string; text: string; border: string; dot: string; label: string }> = {

  red: {

    bg: "bg-rose-50/50",

    text: "text-rose-700",

    border: "border-rose-200",

    dot: "bg-rose-500",

    label: "Critical Attention",

  },

  amber: {

    bg: "bg-amber-50/50",

    text: "text-amber-700",

    border: "border-amber-200",

    dot: "bg-amber-500",

    label: "Needs Review",

  },

  green: {

    bg: "bg-emerald-50/50",

    text: "text-emerald-700",

    border: "border-emerald-200",

    dot: "bg-emerald-500",

    label: "Optimal Fit",

  },

};

const BADGE_STYLES: Record<string, string> = {

  Low: "bg-slate-100 text-slate-700 border-slate-200",

  Medium: "bg-amber-50 text-amber-700 border-amber-200",

  High: "bg-rose-50 text-rose-700 border-rose-200",

};

// Helper function to return visual details for next steps

function getStepDetails(stepItem: string, idx: number) {

  const lowercase = stepItem.toLowerCase();

  

  let icon = <BrainCircuit className="w-4 h-4 text-indigo-600" />;

  let categoryBadge = "System Prep";

  let description = "Establish technical prerequisites and pipeline structures required for AI integration.";

  let impactBadge = "High Impact";

  let timeFrame = "Week 1-2";

  

  if (lowercase.includes("map") || lowercase.includes("logic") || lowercase.includes("workflow") || lowercase.includes("sop") || lowercase.includes("process")) {

    icon = <BrainCircuit className="w-4 h-4 text-indigo-600" />;

    categoryBadge = "Process Mapping";

    description = "Document current workflow touchpoints, decision trees, and input/output formats to translate manual operations into deterministic AI logic.";

    impactBadge = "Foundational";

    timeFrame = "Immediate";

  } else if (lowercase.includes("centralize") || lowercase.includes("crm") || lowercase.includes("erp") || lowercase.includes("data") || lowercase.includes("pipeline") || lowercase.includes("database")) {

    icon = <Network className="w-4 h-4 text-indigo-600" />;

    categoryBadge = "Data Integration";

    description = "Consolidate fragmented business data, customer records, and communication histories into a centralized system of truth (CRM/ERP) accessible by LLM vector stores.";

    impactBadge = "High ROI";

    timeFrame = "Week 2-4";

  } else if (lowercase.includes("schedule") || lowercase.includes("review") || lowercase.includes("consult") || lowercase.includes("scoping") || lowercase.includes("architect")) {

    icon = <Calendar className="w-4 h-4 text-indigo-600" />;

    categoryBadge = "Technical Scoping";

    description = "Review these findings with a senior AI engineer to define technical specifications, API connection limits, security compliance, and pilot scoping parameters.";

    impactBadge = "Strategic";

    timeFrame = "Next 48h";

  } else if (idx === 0) {

    icon = <BrainCircuit className="w-4 h-4 text-indigo-600" />;

    categoryBadge = "Process Audit";

    description = "Examine the manual steps and data exchanges in your current core workflows to identify exact automation opportunities.";

    impactBadge = "Foundational";

    timeFrame = "Week 1";

  } else if (idx === 1) {

    icon = <Network className="w-4 h-4 text-indigo-600" />;

    categoryBadge = "Data Consolidation";

    description = "Map data pipelines and identify critical integrations (APIs, Webhooks) required to support LLM context windows.";

    impactBadge = "High Value";

    timeFrame = "Week 2";

  } else if (idx === 2) {

    icon = <Calendar className="w-4 h-4 text-indigo-600" />;

    categoryBadge = "Review Call";

    description = "Engage with PixelPunch consultants to walk through your RAG scorecard and build a custom project implementation budget.";

    impactBadge = "Actionable";

    timeFrame = "Immediate";

  }

  return { icon, categoryBadge, description, impactBadge, timeFrame };

}

// ── Unlock Modal Component ────────────────────────────────────────────────────

function UnlockModal({ onClose, onEmail }: { onClose: () => void; onEmail: () => void }) {

  return (

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

            <h3 className="font-bold text-slate-900 text-lg">Unlock Your Full AI Report</h3>

            <p className="text-slate-500 text-xs">

              You've seen the highlights. To view the complete AI Opportunity Audit report:

            </p>

          </div>

          <div className="space-y-2 text-left bg-slate-50 rounded-lg p-3">

            <div className="flex items-start gap-2 text-xs text-slate-600">

              <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />

              <span>See all implementation steps with full details</span>

            </div>

            <div className="flex items-start gap-2 text-xs text-slate-600">

              <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />

              <span>Get the complete ROI calculation and implementation roadmap</span>

            </div>

            <div className="flex items-start gap-2 text-xs text-slate-600">

              <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />

              <span>Receive executive summary for stakeholders</span>

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

}

export default function OpportunityResultsContent() {

  const searchParams = useSearchParams();

  const router = useRouter();

  const id = searchParams.get("id");

  const [loading, setLoading] = useState(true);

  const [data, setData] = useState<ResultsData | null>(null);

  const [showReport, setShowReport] = useState(false);

  const [emailModalOpen, setEmailModalOpen] = useState(false);

  // Auto-trigger PDF download when ?download=pdf is in URL (from email link)

  const autoDownload = searchParams.get("download") === "pdf";

  // Website always locked; only unlocked temporarily for PDF generation via email link

  const isUnlocked = autoDownload;

  const triggerPdfDownload = useCallback(async (submId?: string) => {

    try {

      const { default: html2pdf } = await import("html2pdf.js");

      const element = document.getElementById("opportunity-pdf-report-content") || document.getElementById("pdf-report-content");

      if (!element) return;

      const opt = {

        margin: 0,

        filename: `Pixel-Punch-Opportunity-Audit-${submId?.slice(0, 8) ?? "report"}.pdf`,

        image: { type: "jpeg" as const, quality: 0.98 },

        html2canvas: { scale: 2, useCORS: true, logging: false, width: 794, windowWidth: 794 },

        jsPDF: { unit: "mm" as const, format: "a4", orientation: "portrait" as const, compress: true },

        pagebreak: { mode: ["css", "legacy"] as const },

      };

      await html2pdf().set(opt).from(element).save();

    } catch (e) {

      console.error("Auto PDF download failed:", e);

    }

  }, []);

  useEffect(() => {

    if (!id) {

      toast.error("No assessment ID found in URL.");

      router.push("/ai/opportunity-scan");

      return;

    }

    async function fetchResults() {

      try {

        const response = await fetch(`/api/opportunity-scan/result?id=${id}`);

        if (!response.ok) {

          throw new Error("Results not found.");

        }

        const json = await response.json();

        setData(json);

      } catch (err: any) {

        toast.error("Failed to load results. Redirecting...");

        router.push("/ai/opportunity-scan");

      } finally {

        setLoading(false);

      }

    }

    fetchResults();

  }, [id, router]);

  // Trigger PDF download once data is loaded and download param present

  useEffect(() => {

    if (!loading && data && autoDownload) {

      const timer = setTimeout(() => {

        triggerPdfDownload(data.submissionId);

      }, 1500); // wait for DOM to render

      return () => clearTimeout(timer);

    }

  }, [loading, data, autoDownload, triggerPdfDownload]);

  if (loading) {

    return (

      <div className="min-h-screen bg-[#fafbff] flex flex-col items-center justify-center p-6">

        <div className="w-10 h-10 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin mb-3" />

        <p className="text-xs font-semibold text-slate-600 animate-pulse">Analyzing company details & compiling Roadmap...</p>

      </div>

    );

  }

  if (!data) return null;

  // Safe fallback for database vs in-memory api schemas

  const scorecard = data.scorecard || {

    readiness: data.score?.readiness ?? "amber",

    value: data.score?.value ?? "amber",

    opportunity: data.score?.opportunity ?? "amber",

  };

  // Extract categories for 6-grid view, with fallbacks

  const categories = data.score?.categories || {};

  // Extract recommendations safely from db or direct api

  const aiRecs = data.aiRecommendations || (

    Array.isArray(data.recommendations) && data.recommendations.length > 0 && typeof data.recommendations[0] === "object"

      ? (data.recommendations as any[])

      : []

  );

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

  return (

    <main className="min-h-screen bg-[#fafbff] pb-12 overflow-x-hidden">

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

            onClick={() => router.push("/ai/opportunity-scan")}

            className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"

          >

            <ArrowLeft className="w-3.5 h-3.5" />

            New Scan

          </button>

        </div>

      </motion.nav>

      <motion.div 

        variants={staggerContainer}

        initial="hidden"

        animate="show"

        className="max-w-3xl mx-auto px-4 py-8 md:py-10 space-y-6"

      >

        {/* Header Block */}

        <motion.div 

          variants={slideUp}

          className="text-center mb-6"

        >

          <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-600 text-[10px] font-semibold mb-2">

            <span className="relative flex h-2 w-2">

              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-90 shadow-[0_0_10px_#10b981]"></span>

              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_8px_#10b981]"></span>

            </span>

            Audit Status: Live & Completed

          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">

            AI Opportunity Audit Results

          </h1>

          <p className="text-slate-600 text-sm">

            Customized for <strong className="text-slate-800">{data.company.name}</strong> · {data.company.businessType.toUpperCase()} ({data.company.size.replace("_", "-")} employees)

          </p>

        </motion.div>

        {/* 3 Core RAG Dimensions */}

        <motion.div 

          variants={staggerContainer}

          className="grid grid-cols-1 md:grid-cols-3 gap-3"

        >

          {[

            {

              title: "Technical AI Readiness",

              desc: "Workflow standardization, data structure, and system connection levels.",

              rag: scorecard.readiness,

            },

            {

              title: "Business Value Potential",

              desc: "Urgency of resolving core manual pain points and expected ROI.",

              rag: scorecard.value,

            },

            {

              title: "Automation Opportunity",

              desc: "Density of routine data and customer processes ready for AI.",

              rag: scorecard.opportunity,

            },

          ].map((card, idx) => {

            const styles = RAG_STYLES[card.rag];

            return (

              <motion.div 

                key={idx} 

                variants={slideUp}

                whileHover={{ 

                  y: -2, 

                  borderColor: "#cbd5e1"

                }}

                className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm flex flex-col justify-between transition-all duration-300"

              >

                <div>

                  <h3 className="font-bold text-slate-900 text-xs mb-1">{card.title}</h3>

                  <p className="text-slate-500 text-[10px] leading-relaxed">{card.desc}</p>

                </div>

                <div className={`rounded border p-2 flex items-center justify-between ${styles.bg} ${styles.border}`}>

                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-700">{styles.label}</span>

                  <span className="flex items-center gap-1">

                    <span className="relative flex h-1.5 w-1.5">

                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${styles.dot} opacity-75`}></span>

                      <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${styles.dot}`}></span>

                    </span>

                    <span className={`text-[9px] font-extrabold uppercase ${styles.text}`}>{card.rag}</span>

                  </span>

                </div>

              </motion.div>

            );

          })}

        </motion.div>

        {/* 6 Category Score Breakdown */}

        {Object.keys(categories).length > 0 && (

          <motion.div 

            variants={slideUp}

            className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm"

          >

            <h2 className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-2">

              <LineChart className="w-3.5 h-3.5 text-indigo-500" />

              Dimension Performance Breakdown

            </h2>

            <p className="text-[10px] text-slate-500 mb-3">

              Evaluation scores normalized to 100 based on questionnaire rulesets.

            </p>

            <div className="space-y-3">

              {/* 1st Dimension (Always Visible) */}

              {(() => {

                const [key, cat] = Object.entries(categories)[0];

                return (

                  <div className="space-y-1.5 border border-slate-100 bg-slate-50/50 p-3 rounded-lg shadow-sm">

                    <div className="flex justify-between items-center text-xs">

                      <span className="font-semibold text-slate-800">{cat.name}</span>

                      <span className="text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 px-1.5 py-0.5 rounded-full">

                        {cat.score} / {cat.maxScore}

                      </span>

                    </div>

                    <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">

                      <div 

                        className="h-full bg-indigo-600 rounded-full" 

                        style={{ width: `${(cat.score / cat.maxScore) * 100}%` }}

                      />

                    </div>

                    <div className="flex justify-between items-center text-[9px] text-slate-500">

                      <span>{cat.description}</span>

                      <span className="uppercase font-bold tracking-wider">{cat.classification}</span>

                    </div>

                  </div>

                );

              })()}

              {/* Remaining 5 Dimensions (Gated) */}

              <div className="relative">

                <div className={`grid grid-cols-1 md:grid-cols-2 gap-3 transition-all duration-500 ${!isUnlocked ? "blur-md select-none pointer-events-none opacity-40" : ""}`}>

                  {Object.entries(categories).slice(1).map(([key, cat]) => (

                    <div 

                      key={key} 

                      className="space-y-1.5 border border-slate-100 bg-slate-50/50 p-3 rounded-lg shadow-sm"

                    >

                      <div className="flex justify-between items-center text-xs">

                        <span className="font-semibold text-slate-800">{cat.name}</span>

                        <span className="text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 px-1.5 py-0.5 rounded-full">

                          {cat.score} / {cat.maxScore}

                        </span>

                      </div>

                      <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">

                        <div 

                          className="h-full bg-indigo-600 rounded-full" 

                          style={{ width: `${(cat.score / cat.maxScore) * 100}%` }}

                        />

                      </div>

                      <div className="flex justify-between items-center text-[9px] text-slate-500">

                        <span>{cat.description}</span>

                        <span className="uppercase font-bold tracking-wider">{cat.classification}</span>

                      </div>

                    </div>

                  ))}

                </div>

                {/* Lock Overlay */}

                {!isUnlocked && (

                  <div className="absolute inset-0 bg-slate-50/10 backdrop-blur-[2px] flex flex-col items-center justify-center p-4 text-center rounded-lg border border-slate-200/50 shadow-inner">

                    <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-md max-w-sm flex flex-col items-center space-y-4">

                      <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center border border-indigo-100 text-indigo-600">

                        <Lock className="w-5 h-5" />

                      </div>

                      <div>

                        <h3 className="text-sm font-bold text-slate-900">Unlock Your Business Growth Potential</h3>

                        <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">

                          Don&apos;t fall behind. Secure full insights and unlock the other 5 performance dimensions now.

                        </p>

                      </div>

                      <button

                        onClick={() => setEmailModalOpen(true)}

                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs transition-colors shadow-sm flex items-center justify-center gap-1.5"

                      >

                        <Unlock className="w-3.5 h-3.5" />

                        Unlock Full Report

                      </button>

                    </div>

                  </div>

                )}

              </div>

            </div>

          </motion.div>

        )}

        {/* Recommended AI Opportunities */}

        {aiRecs.length > 0 && (

          <motion.div 

            variants={slideUp}

            className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm"

          >

            <h2 className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-2">

              <BrainCircuit className="w-3.5 h-3.5 text-indigo-500" />

              Recommended AI Opportunities

            </h2>

            <p className="text-[10px] text-slate-500 mb-3">

              Custom systems generated specifically to address your workflow answers.

            </p>

            <div className="relative">

              <div className={`grid grid-cols-1 gap-3 transition-all duration-500 ${!isUnlocked ? "blur-md select-none pointer-events-none opacity-30" : ""}`}>

                {aiRecs.map((rec, idx) => (

                  <motion.div 

                    key={idx} 

                    whileHover={{ 

                      y: -2, 

                      borderColor: "#6366f1", 

                      boxShadow: "0 8px 12px -3px rgba(99, 102, 241, 0.03)"

                    }}

                    className="border border-slate-200 rounded-lg p-3 bg-slate-50/30 flex flex-col justify-between gap-3 transition-all duration-300 shadow-sm"

                  >

                    <div className="flex flex-wrap justify-between items-start gap-2 border-b border-slate-100 pb-2">

                      <div>

                        <h3 className="font-bold text-slate-900 text-xs flex items-center gap-2">

                          <span className="w-5 h-5 rounded bg-indigo-100 text-indigo-700 font-extrabold text-[9px] flex items-center justify-center">

                            {idx + 1}

                          </span>

                          {rec.opportunity}

                        </h3>

                      </div>

                      <div className="flex gap-1.5">

                        <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 border rounded-full ${BADGE_STYLES[rec.priority]}`}>

                          Priority: {rec.priority}

                        </span>

                        <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 border rounded-full ${BADGE_STYLES[rec.complexity]}`}>

                          Complexity: {rec.complexity}

                        </span>

                      </div>

                    </div>

                    

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[10px]">

                      <div>

                        <p className="font-bold text-slate-700 mb-0.5 uppercase tracking-wider text-[9px]">Challenge Solved</p>

                        <p className="text-slate-600 leading-relaxed">{rec.problem}</p>

                      </div>

                      <div>

                        <p className="font-bold text-slate-700 mb-0.5 uppercase tracking-wider text-[9px]">Business Value & Impact</p>

                        <p className="text-slate-600 leading-relaxed">{rec.impact}</p>

                      </div>

                    </div>

                  </motion.div>

                ))}

              </div>

              {/* Lock Overlay */}

              {!isUnlocked && (

                <div 

                  onClick={() => setEmailModalOpen(true)}

                  className="absolute inset-0 bg-white/85 backdrop-blur-[2.5px] rounded-xl flex items-center justify-center z-10 cursor-pointer hover:bg-white/90 border border-slate-200/50 shadow-sm transition-all duration-300 min-h-[160px]"

                >

                  <div className="text-center p-4">

                    <Lock className="w-5 h-5 text-indigo-600 mx-auto mb-1.5" />

                    <h3 className="text-[10px] font-bold text-slate-800 uppercase tracking-wider mb-0.5">

                      Premium AI Opportunities Locked

                    </h3>

                    <p className="text-[9px] text-slate-500 mb-2.5">

                      Unlock to reveal custom systems generated to address your workflow requirements.

                    </p>

                    <button

                      onClick={(e) => {

                        e.stopPropagation();

                        setEmailModalOpen(true);

                      }}

                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[10px] font-bold transition-colors shadow-sm"

                    >

                      Unlock Opportunities

                    </button>

                  </div>

                </div>

              )}

            </div>

          </motion.div>

        )}

        {/* Priority Next Steps - Visual Upgrade - GATED */}

        {data.nextSteps && data.nextSteps.length > 0 && (

          <motion.div 

            variants={slideUp}

            className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm"

          >

            <div className="flex items-center justify-between mb-4">

              <h2 className="text-xs font-bold text-slate-900 flex items-center gap-2">

                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" />

                Priority Actions & Next Steps

              </h2>

              <button

                onClick={() => setEmailModalOpen(true)}

                className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 hover:text-indigo-700 transition-colors"

              >

                <Unlock className="w-3 h-3" />

                Unlock All

              </button>

            </div>

            <p className="text-[10px] text-slate-500 mb-3">

              PixelPunch recommends executing these foundational steps to prepare your operational systems for AI integration.

            </p>

            

            <div className="flex flex-col gap-3">

              {data.nextSteps.slice(0, 2).map((stepItem, idx) => {

                const details = getStepDetails(stepItem, idx);

                return (

                  <motion.div 

                    key={idx} 

                    whileHover={{ 

                      y: -1, 

                      borderColor: "#6366f1", 

                      boxShadow: "0 4px 6px -1px rgba(99, 102, 241, 0.03)"

                    }}

                    className="border border-slate-200 rounded-xl p-4 bg-slate-50/20 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-300 cursor-default relative overflow-hidden shadow-sm"

                  >

                    <div className="flex items-start gap-3 flex-1">

                      {/* Icon Circle */}

                      <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center border border-indigo-100 shadow-sm flex-shrink-0 mt-0.5">

                        {details.icon}

                      </div>

                      <div className="space-y-1 flex-1">

                        {/* Header Badge & Timeline */}

                        <div className="flex items-center gap-2">

                          <span className="text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 px-1.5 py-0.5 rounded-full uppercase tracking-wider">

                            {details.categoryBadge}

                          </span>

                          <span className="text-[9px] font-semibold text-slate-500 flex items-center gap-1">

                            <Clock className="w-3 h-3 text-slate-400" />

                            {details.timeFrame}

                          </span>

                        </div>

                        {/* Title */}

                        <h3 className="font-bold text-slate-900 text-xs leading-snug">

                          {stepItem}

                        </h3>

                        {/* Description */}

                        <p className="text-slate-500 text-[10px] leading-relaxed max-w-xl">

                          {details.description}

                        </p>

                      </div>

                    </div>

                    {/* Right Side Status/Milestone Badge */}

                    <div className="flex items-center justify-between md:flex-col md:items-end gap-2 border-t md:border-t-0 border-slate-100 pt-3 md:pt-0 mt-1 md:mt-0 md:pl-4 md:border-l border-slate-100 flex-shrink-0 min-w-[120px]">

                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Milestone {idx + 1}</span>

                      <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50/50 px-2 py-0.5 rounded border border-indigo-100/30">

                        {details.impactBadge}

                      </span>

                    </div>

                  </motion.div>

                );

              })}

              {/* Gated Steps - Blurred */}

              {data.nextSteps.length > 2 && (

                <div className="relative group">

                  <div className="absolute inset-0 bg-white/85 backdrop-blur-[2.5px] rounded-xl flex items-center justify-center z-10 cursor-pointer hover:bg-white/90 border border-slate-200/50 shadow-sm transition-all duration-300"

                    onClick={() => setEmailModalOpen(true)}

                  >

                    <div className="text-center p-3">

                      <Lock className="w-5 h-5 text-indigo-600 mx-auto mb-1" />

                      <p className="text-[10px] font-bold text-slate-800 uppercase tracking-wider mb-0.5">

                        Premium Steps Locked

                      </p>

                      <p className="text-[9px] text-slate-500 mb-2">

                        Unlock to see all {data.nextSteps.length} steps

                      </p>

                      <button

                        onClick={(e) => {

                          e.stopPropagation();

                          setEmailModalOpen(true);

                        }}

                        className="px-3.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[10px] font-bold transition-colors shadow-sm"

                      >

                        Unlock Now

                      </button>

                    </div>

                  </div>

                  

                  <div className="opacity-30 blur-[2px] select-none pointer-events-none flex flex-col gap-3">

                    {data.nextSteps.slice(2).map((stepItem, idx) => {

                      const details = getStepDetails(stepItem, idx + 2);

                      const actualIdx = idx + 2;

                      return (

                        <div 

                          key={actualIdx} 

                          className="border border-slate-200 rounded-xl p-4 bg-slate-50/20 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-300"

                        >

                          <div className="flex items-start gap-3 flex-1">

                            <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center border border-indigo-100 shadow-sm flex-shrink-0 mt-0.5">

                              {details.icon}

                            </div>

                            <div className="space-y-1 flex-1">

                              <div className="flex items-center gap-2">

                                <span className="text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 px-1.5 py-0.5 rounded-full uppercase tracking-wider">

                                  {details.categoryBadge}

                                </span>

                                <span className="text-[9px] font-semibold text-slate-500 flex items-center gap-1">

                                  <Clock className="w-3 h-3 text-slate-400" />

                                  {details.timeFrame}

                                </span>

                              </div>

                              <h3 className="font-bold text-slate-900 text-xs leading-snug">

                                {stepItem}

                              </h3>

                              <p className="text-slate-500 text-[10px] leading-relaxed max-w-xl">

                                {details.description}

                              </p>

                            </div>

                          </div>

                          <div className="flex items-center justify-between md:flex-col md:items-end gap-2 border-t md:border-t-0 border-slate-100 pt-3 md:pt-0 mt-1 md:mt-0 md:pl-4 md:border-l border-slate-100 flex-shrink-0 min-w-[120px]">

                            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Milestone {actualIdx + 1}</span>

                            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50/50 px-2 py-0.5 rounded border border-indigo-100/30">

                              {details.impactBadge}

                            </span>

                          </div>

                        </div>

                      );

                    })}

                  </div>

                </div>

              )}

            </div>

          </motion.div>

        )}

        {/* Phased Roadmap Timeline - GATED */}

        <motion.div 

          variants={slideUp}

          className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm"

        >

          <div className="flex items-center justify-between mb-4">

            <h2 className="text-xs font-bold text-slate-900 flex items-center gap-2">

              <Network className="w-3.5 h-3.5 text-indigo-500" />

              Phased AI Adoption Roadmap

            </h2>

            <button

              onClick={() => {

                if (isUnlocked) return;

                setEmailModalOpen(true);

              }}

              className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 hover:text-indigo-700 transition-colors"

            >

              {isUnlocked ? <CheckCircle2 className="w-3 h-3 text-green-500" /> : <Unlock className="w-3 h-3" />}

              {isUnlocked ? "Roadmap Unlocked" : "Unlock Full Roadmap"}

            </button>

          </div>

          <p className="text-[10px] text-slate-500 mb-4">

            Implementation milestones designed to optimize deployment complexity vs ROI.

          </p>

          <div className="relative border-l border-indigo-100 pl-4 ml-3 space-y-4">

            {/* Phase 1 - Visible */}

            <motion.div 

              whileHover={{ x: 3 }}

              className="relative transition-all duration-250"

            >

              <span className="absolute -left-[22px] top-0 w-5 h-5 rounded-full border-2 border-indigo-500 bg-white flex items-center justify-center text-[9px] font-bold text-indigo-600">

                1

              </span>

              <h3 className="text-xs font-bold text-slate-900 mb-1.5 flex items-center gap-2">

                Phase 1: Quick Wins (0-3 Months)

                <span className="text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 px-1.5 py-0.5 rounded">High Feasibility</span>

              </h3>

              <ul className="list-disc pl-4 space-y-1 text-[10px] text-slate-600">

                {data.roadmap.phase1.map((item, i) => <li key={i}>{item}</li>)}

              </ul>

            </motion.div>

            {/* Phase 2 & 3 - Gated together */}

            <div className="relative group space-y-4 overflow-hidden rounded-lg">

              {!isUnlocked && (

                <div 

                  onClick={() => setEmailModalOpen(true)}

                  className="absolute inset-0 bg-white/85 backdrop-blur-[2.5px] rounded-lg flex items-center justify-center z-10 cursor-pointer hover:bg-white/90 border border-slate-200/50 shadow-sm transition-all duration-300"

                >

                  <div className="text-center p-4">

                    <Lock className="w-5 h-5 text-indigo-600 mx-auto mb-1.5" />

                    <h3 className="text-[10px] font-bold text-slate-800 uppercase tracking-wider mb-0.5">

                      Premium Roadmap Locked

                    </h3>

                    <p className="text-[9px] text-slate-500 mb-2.5">

                      Unlock to reveal the full multi-phase AI transformation roadmap.

                    </p>

                    <button

                      onClick={(e) => {

                        e.stopPropagation();

                        setEmailModalOpen(true);

                      }}

                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[10px] font-bold transition-colors shadow-sm"

                    >

                      Unlock Roadmap

                    </button>

                  </div>

                </div>

              )}

              

              <div className={`space-y-4 transition-all duration-500 min-h-[160px] ${!isUnlocked ? "blur-md select-none pointer-events-none opacity-30" : ""}`}>

                {/* Phase 2 */}

                <div className="relative z-0">

                  <span className="absolute -left-[22px] top-0 w-5 h-5 rounded-full border-2 border-indigo-500 bg-white flex items-center justify-center text-[9px] font-bold text-indigo-600">

                    2

                  </span>

                  <h3 className="text-xs font-bold text-slate-900 mb-1.5 flex items-center gap-2">

                    Phase 2: Core Enhancements (3-6 Months)

                    <span className="text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-100 px-1.5 py-0.5 rounded">Core Transformation</span>

                  </h3>

                  <ul className="list-disc pl-4 space-y-1 text-[10px] text-slate-600">

                    {data.roadmap.phase2.map((item, i) => <li key={i}>{item}</li>)}

                  </ul>

                </div>

                {/* Phase 3 */}

                <div className="relative z-0">

                  <span className="absolute -left-[22px] top-0 w-5 h-5 rounded-full border-2 border-indigo-500 bg-white flex items-center justify-center text-[9px] font-bold text-indigo-600">

                    3

                  </span>

                  <h3 className="text-xs font-bold text-slate-900 mb-1.5 flex items-center gap-2">

                    Phase 3: Strategic Scaling (6-12+ Months)

                    <span className="text-[9px] font-bold bg-violet-50 text-violet-700 border border-violet-100 px-1.5 py-0.5 rounded">Agentic Automation</span>

                  </h3>

                  <ul className="list-disc pl-4 space-y-1 text-[10px] text-slate-600">

                    {data.roadmap.phase3.map((item, i) => <li key={i}>{item}</li>)}

                  </ul>

                </div>

              </div>

            </div>

          </div>

        </motion.div>

        {/* Lead Capture Sales CTA */}

        <motion.div 

          variants={slideUp}

          className="bg-slate-900 rounded-lg p-6 text-center text-white space-y-4 shadow-md border border-slate-800"

        >

          <ShieldCheck className="w-10 h-10 text-indigo-400 mx-auto" />

          <div className="max-w-xl mx-auto">

            <h2 className="text-lg md:text-xl font-bold">Review Your Custom Roadmap with an AI Architect</h2>

            <p className="text-slate-400 text-xs mt-1">

              Book a free 15-minute diagnostic call. We will walk you through your RAG scoring dashboard, suggest optimization steps, and define integration scopes.

            </p>

          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-2">

            <a

              href="https://pixelpunch.org/services/consulting"

              target="_blank"

              rel="noopener noreferrer"

              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 transition-colors rounded-lg font-bold text-xs flex items-center justify-center gap-2"

            >

              <Calendar className="w-3.5 h-3.5" />

              Schedule Review Call

            </a>

            <button

              onClick={() => setEmailModalOpen(true)}

              className="px-5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors rounded-lg font-bold text-xs flex items-center justify-center gap-2"

            >

              <Mail className="w-3.5 h-3.5" />

              Email Roadmap Report

            </button>

          </div>

        </motion.div>

      </motion.div>

      {/* Unlock Modal */}

      {/* Email Modal */}

      {data && (

        <EmailModal

          isOpen={emailModalOpen}

          onClose={() => setEmailModalOpen(false)}

          submissionId={data.submissionId}

          scanType="opportunity"

        />

      )}

    </main>

  );

}