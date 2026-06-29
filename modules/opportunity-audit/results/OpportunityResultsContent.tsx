"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import { ContactBar } from "@/shared/components/ContactBar";
import { 
  CheckCircle2, ShieldCheck, ArrowLeft, Clock, Calendar, 
  Rocket, Network, Sparkles, AlertCircle, FileText, ChevronDown, ChevronUp,
  LineChart, BrainCircuit, Info, Mail
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

const BADGE_STYLES = {
  Low: "bg-slate-100 text-slate-700 border-slate-200",
  Medium: "bg-amber-50 text-amber-700 border-amber-200",
  High: "bg-rose-50 text-rose-700 border-rose-200",
};

// Helper function to return visual details for next steps
function getStepDetails(stepItem: string, idx: number) {
  const lowercase = stepItem.toLowerCase();
  
  // Default values
  let icon = <BrainCircuit className="w-5 h-5 text-indigo-650" />;
  let categoryBadge = "System Prep";
  let description = "Establish technical prerequisites and pipeline structures required for AI integration.";
  let impactBadge = "High Impact";
  let timeFrame = "Week 1-2";
  
  if (lowercase.includes("map") || lowercase.includes("logic") || lowercase.includes("workflow") || lowercase.includes("sop") || lowercase.includes("process")) {
    icon = <BrainCircuit className="w-5 h-5 text-indigo-600" />;
    categoryBadge = "Process Mapping";
    description = "Document current workflow touchpoints, decision trees, and input/output formats to translate manual operations into deterministic AI logic.";
    impactBadge = "Foundational";
    timeFrame = "Immediate";
  } else if (lowercase.includes("centralize") || lowercase.includes("crm") || lowercase.includes("erp") || lowercase.includes("data") || lowercase.includes("pipeline") || lowercase.includes("database")) {
    icon = <Network className="w-5 h-5 text-indigo-600" />;
    categoryBadge = "Data Integration";
    description = "Consolidate fragmented business data, customer records, and communication histories into a centralized system of truth (CRM/ERP) accessible by LLM vector stores.";
    impactBadge = "High ROI";
    timeFrame = "Week 2-4";
  } else if (lowercase.includes("schedule") || lowercase.includes("review") || lowercase.includes("consult") || lowercase.includes("scoping") || lowercase.includes("architect")) {
    icon = <Calendar className="w-5 h-5 text-indigo-600" />;
    categoryBadge = "Technical Scoping";
    description = "Review these findings with a senior AI engineer to define technical specifications, API connection limits, security compliance, and pilot scoping parameters.";
    impactBadge = "Strategic";
    timeFrame = "Next 48h";
  } else if (idx === 0) {
    icon = <BrainCircuit className="w-5 h-5 text-indigo-600" />;
    categoryBadge = "Process Audit";
    description = "Examine the manual steps and data exchanges in your current core workflows to identify exact automation opportunities.";
    impactBadge = "Foundational";
    timeFrame = "Week 1";
  } else if (idx === 1) {
    icon = <Network className="w-5 h-5 text-indigo-600" />;
    categoryBadge = "Data Consolidation";
    description = "Map data pipelines and identify critical integrations (APIs, Webhooks) required to support LLM context windows.";
    impactBadge = "High Value";
    timeFrame = "Week 2";
  } else if (idx === 2) {
    icon = <Calendar className="w-5 h-5 text-indigo-600" />;
    categoryBadge = "Review Call";
    description = "Engage with PixelPunch consultants to walk through your RAG scorecard and build a custom project implementation budget.";
    impactBadge = "Actionable";
    timeFrame = "Immediate";
  }

  return { icon, categoryBadge, description, impactBadge, timeFrame };
}

export default function OpportunityResultsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get("id");

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ResultsData | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafbff] flex flex-col items-center justify-center p-6">
        <div className="w-12 h-12 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-600 animate-pulse">Analyzing company details & compiling Roadmap...</p>
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

  return (
    <main className="min-h-screen bg-[#fafbff] pb-20 overflow-x-hidden">
      {/* Contact Bar */}
      <ContactBar containerClassName="max-w-5xl" />

      {/* Nav Strip */}
      <motion.nav 
        variants={fadeIn} 
        initial="hidden" 
        animate="show"
        className="border-b border-slate-200 px-6 py-4 bg-white/50 backdrop-blur-md sticky top-0 z-40"
      >
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <a href="/" className="flex items-center hover:opacity-80 transition-opacity">
            <Image src="/logo.jpg" alt="Pixel Punch" width={120} height={36} className="h-9 w-auto object-contain" />
          </a>
          <button
            onClick={() => router.push("/ai/opportunity-scan")}
            className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            New Scan
          </button>
        </div>
      </motion.nav>

      <motion.div 
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="max-w-5xl mx-auto px-4 mt-8 md:mt-12 space-y-8"
      >
        {/* Header Block */}
        <motion.div 
          variants={slideUp}
          className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
        >
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-indigo-600 bg-indigo-50/70 border border-indigo-150 px-2.5 py-1 rounded-full mb-3">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Audit Status: Live & Completed
            </span>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 flex items-center gap-2">
              AI Opportunity Audit
              <Sparkles className="w-5 h-5 text-indigo-500 animate-pulse" />
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Customized for <strong className="text-slate-800">{data.company.name}</strong> · {data.company.businessType.toUpperCase()} ({data.company.size.replace("_", "-")} employees)
            </p>
          </div>
          <div className="flex items-center gap-2.5 text-xs text-slate-500 border border-slate-100 bg-slate-50 px-4 py-3 rounded-lg">
            <Clock className="w-4 h-4 text-indigo-500" />
            <div>
              <p className="font-semibold text-slate-700">Generated On</p>
              <p>{new Date(data.createdDate).toLocaleDateString(undefined, { dateStyle: "medium" })}</p>
            </div>
          </div>
        </motion.div>

        {/* 3 Core RAG Dimensions */}
        <motion.div 
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
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
                  y: -6, 
                  boxShadow: "0 12px 20px -8px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.08)",
                  borderColor: "#cbd5e1"
                }}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between transition-all duration-300 cursor-pointer"
              >
                <div>
                  <h3 className="font-bold text-slate-900 text-base mb-1">{card.title}</h3>
                  <p className="text-slate-500 text-xs leading-relaxed mb-4">{card.desc}</p>
                </div>
                <div className={`rounded-xl border p-3 flex items-center justify-between ${styles.bg} ${styles.border}`}>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">{styles.label}</span>
                  <span className="flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${styles.dot} opacity-75`}></span>
                      <span className={`relative inline-flex rounded-full h-2 w-2 ${styles.dot}`}></span>
                    </span>
                    <span className={`text-xs font-extrabold uppercase ${styles.text}`}>{card.rag}</span>
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
            className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm"
          >
            <h2 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
              <LineChart className="w-5 h-5 text-indigo-500" />
              Dimension Performance Breakdown
            </h2>
            <p className="text-xs text-slate-500 mb-6">
              Evaluation scores normalized to 100 based on questionnaire rulesets.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(categories).map(([key, cat]) => (
                <motion.div 
                  key={key} 
                  whileHover={{ scale: 1.015, y: -2 }}
                  className="space-y-2 border border-slate-100 bg-slate-50/50 p-4 rounded-xl transition-all duration-300 shadow-sm"
                >
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-semibold text-slate-800">{cat.name}</span>
                    <span className="text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded-full">
                      {cat.score} / {cat.maxScore}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-indigo-600 rounded-full" 
                      initial={{ width: 0 }}
                      whileInView={{ width: `${(cat.score / cat.maxScore) * 100}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.2, ease: "easeOut", delay: 0.15 }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-500">
                    <span>{cat.description}</span>
                    <span className="uppercase font-bold tracking-wider">{cat.classification}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Recommended AI Opportunities */}
        {aiRecs.length > 0 && (
          <motion.div 
            variants={slideUp}
            className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm"
          >
            <h2 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-indigo-500" />
              Recommended AI Opportunities
            </h2>
            <p className="text-xs text-slate-500 mb-6">
              Custom systems generated specifically to address your workflow answers.
            </p>

            <div className="grid grid-cols-1 gap-6">
              {aiRecs.map((rec, idx) => (
                <motion.div 
                  key={idx} 
                  whileHover={{ 
                    y: -5, 
                    borderColor: "#6366f1", 
                    backgroundColor: "rgba(99, 102, 241, 0.02)",
                    boxShadow: "0 10px 20px -5px rgba(99, 102, 241, 0.05)"
                  }}
                  className="border border-slate-200 rounded-xl p-5 md:p-6 bg-slate-50/30 flex flex-col justify-between gap-4 transition-all duration-300 shadow-sm"
                >
                  <div className="flex flex-wrap justify-between items-start gap-3 border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 font-extrabold text-xs flex items-center justify-center">
                          {idx + 1}
                        </span>
                        {rec.opportunity}
                      </h3>
                    </div>
                    <div className="flex gap-2">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 border rounded-full ${BADGE_STYLES[rec.priority]}`}>
                        Priority: {rec.priority}
                      </span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 border rounded-full ${BADGE_STYLES[rec.complexity]}`}>
                        Complexity: {rec.complexity}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div>
                      <p className="font-bold text-slate-700 mb-1 uppercase tracking-wider text-[10px]">Challenge Solved</p>
                      <p className="text-slate-600 leading-relaxed">{rec.problem}</p>
                    </div>
                    <div>
                      <p className="font-bold text-slate-700 mb-1 uppercase tracking-wider text-[10px]">Business Value & Impact</p>
                      <p className="text-slate-600 leading-relaxed">{rec.impact}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Priority Next Steps - Visual Upgrade */}
        {data.nextSteps && data.nextSteps.length > 0 && (
          <motion.div 
            variants={slideUp}
            className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm"
          >
            <h2 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-indigo-500" />
              Priority Actions & Next Steps
            </h2>
            <p className="text-xs text-slate-500 mb-6">
              PixelPunch recommends executing these foundational steps to prepare your operational systems for AI integration.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {data.nextSteps.map((stepItem, idx) => {
                const details = getStepDetails(stepItem, idx);
                return (
                  <motion.div 
                    key={idx} 
                    whileHover={{ 
                      y: -8, 
                      borderColor: "#6366f1", 
                      boxShadow: "0 15px 30px -10px rgba(99, 102, 241, 0.12)"
                    }}
                    className="border border-slate-200 rounded-2xl p-6 bg-slate-50/20 flex flex-col justify-between gap-5 transition-all duration-300 cursor-default relative overflow-hidden shadow-sm"
                  >
                    {/* Top background accent card number */}
                    <div className="absolute top-2 right-4 text-6xl font-black text-slate-100/50 select-none font-sans pointer-events-none">
                      {idx + 1}
                    </div>

                    <div className="space-y-4 relative z-10">
                      {/* Icon Circle */}
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center border border-indigo-100 shadow-sm">
                        {details.icon}
                      </div>

                      {/* Header Badge & Timeline */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                          {details.categoryBadge}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {details.timeFrame}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="font-bold text-slate-900 text-sm leading-snug">
                        {stepItem}
                      </h3>

                      {/* Description */}
                      <p className="text-slate-500 text-xs leading-relaxed">
                        {details.description}
                      </p>
                    </div>

                    {/* Bottom Status/Impact Badge */}
                    <div className="border-t border-slate-100 pt-3 mt-1 flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-slate-600 relative z-10">
                      <span>Milestone {idx + 1}</span>
                      <span className="text-indigo-600 bg-indigo-50/50 px-2 py-0.5 rounded">
                        {details.impactBadge}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Phased Roadmap Timeline */}
        <motion.div 
          variants={slideUp}
          className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm"
        >
          <h2 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
            <Network className="w-5 h-5 text-indigo-500" />
            Phased AI Adoption Roadmap
          </h2>
          <p className="text-xs text-slate-500 mb-8">
            Implementation milestones designed to optimize deployment complexity vs ROI.
          </p>

          <div className="relative border-l border-indigo-100 pl-6 ml-4 space-y-8">
            <motion.div 
              whileHover={{ x: 4 }}
              className="relative transition-all duration-250"
            >
              <span className="absolute -left-[35px] top-0 w-6 h-6 rounded-full border-2 border-indigo-500 bg-white flex items-center justify-center text-xs font-bold text-indigo-600">
                1
              </span>
              <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                Phase 1: Quick Wins (0-3 Months)
                <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded">High Feasibility</span>
              </h3>
              <ul className="list-disc pl-4 space-y-1.5 text-xs text-slate-600">
                {data.roadmap.phase1.map((item, i) => <li key={i}>{item}</li>)}
              </ul>
            </motion.div>

            <motion.div 
              whileHover={{ x: 4 }}
              className="relative transition-all duration-250"
            >
              <span className="absolute -left-[35px] top-0 w-6 h-6 rounded-full border-2 border-indigo-500 bg-white flex items-center justify-center text-xs font-bold text-indigo-600">
                2
              </span>
              <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                Phase 2: Core Enhancements (3-6 Months)
                <span className="text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded">Core Transformation</span>
              </h3>
              <ul className="list-disc pl-4 space-y-1.5 text-xs text-slate-600">
                {data.roadmap.phase2.map((item, i) => <li key={i}>{item}</li>)}
              </ul>
            </motion.div>

            <motion.div 
              whileHover={{ x: 4 }}
              className="relative transition-all duration-250"
            >
              <span className="absolute -left-[35px] top-0 w-6 h-6 rounded-full border-2 border-indigo-500 bg-white flex items-center justify-center text-xs font-bold text-indigo-600">
                3
              </span>
              <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                Phase 3: Strategic Scaling (6-12+ Months)
                <span className="text-[10px] font-bold bg-violet-50 text-violet-700 border border-violet-100 px-2 py-0.5 rounded">Agentic Automation</span>
              </h3>
              <ul className="list-disc pl-4 space-y-1.5 text-xs text-slate-600">
                {data.roadmap.phase3.map((item, i) => <li key={i}>{item}</li>)}
              </ul>
            </motion.div>
          </div>
        </motion.div>

        {/* Accordion view for Full Consulting Report */}
        {data.auditReport && (
          <motion.div 
            variants={slideUp}
            className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm"
          >
            <button
              onClick={() => setShowReport(!showReport)}
              className="w-full flex justify-between items-center text-left"
            >
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-500" />
                  Read Full Scoping & Audit Report
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Click to expand the detailed consultative report generated by the AI Opportunity Audit.
                </p>
              </div>
              {showReport ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
            </button>

            {showReport && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                transition={{ duration: 0.3 }}
                className="mt-8 border-t border-slate-100 pt-6 prose prose-indigo max-w-none text-slate-700 text-sm leading-relaxed space-y-4 whitespace-pre-line overflow-hidden"
              >
                {data.auditReport}
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Lead Capture Sales CTA */}
        <motion.div 
          variants={slideUp}
          className="bg-slate-900 rounded-2xl p-8 text-center text-white space-y-6 shadow-md border border-slate-800"
        >
          <ShieldCheck className="w-12 h-12 text-indigo-400 mx-auto" />
          <div className="max-w-xl mx-auto">
            <h2 className="text-xl md:text-2xl font-bold">Review Your Custom Roadmap with an AI Architect</h2>
            <p className="text-slate-400 text-sm mt-2">
              Book a free 15-minute diagnostic call. We will walk you through your RAG scoring dashboard, suggest optimization steps, and define integration scopes.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <a
              href="https://pixelpunch.org/services/consulting"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 transition-colors rounded-lg font-bold text-sm flex items-center justify-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              Schedule Review Call
            </a>
            <button
              onClick={() => setEmailModalOpen(true)}
              className="px-6 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors rounded-lg font-bold text-sm flex items-center justify-center gap-2"
            >
              <Mail className="w-4 h-4" />
              Email Roadmap Report
            </button>
          </div>
        </motion.div>
      </motion.div>

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
