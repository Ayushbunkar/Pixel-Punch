"use client";

import React, { Fragment, useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import toast from "react-hot-toast";

import { useSearchParams, useRouter } from "next/navigation";

import { StoredScanResult } from "@/modules/cost-audit/types";
import Image from "next/image";

import { Cpu, Download, CheckCircle2 } from "lucide-react";
import { RAG_META } from "@/shared/utils/rag-styles";

import { ContactBar } from "@/shared/components/ContactBar";

import * as motion from "framer-motion/client";

import { slideUp, staggerContainer, fadeIn } from "@/shared/components/animations";

import { StatCard } from "@/shared/components/StatCard";
import scoreDescriptions from "@/shared/config/score-descriptions.json";

import { InsightsList } from "./InsightsList";

import { TierRecommendation } from "./TierRecommendation";

import { ShareResults } from "./ShareResults";

import { ResultsSkeleton } from "./ResultsSkeleton";

import { EmailModal } from "@/shared/components/EmailModal";
import { UnlockModal } from "@/shared/components/UnlockModal";
import { LockOverlay } from "@/shared/components/LockOverlay";
import { SavingsProjection, NinetyDayRoadmap, OptimizationOpportunities } from "./VisualExtensions";

// Strips markdown syntax down to plain text (used for the plain-text PDF body).
const cleanMarkdownForPdf = (md: string) => {
  if (!md) return "";
  return md
    .split("\n")
    .map((line) => {
      let trimmed = line.trim();
      trimmed = trimmed.replace(/^#{1,6}\s+/, "");
      trimmed = trimmed.replace(/^([-*+•]\s*)+/, "");
      trimmed = trimmed.replace(/^\d+\.\s+/, "");
      trimmed = trimmed.replace(/\*\*(.*?)\*\*/g, "$1");
      trimmed = trimmed.replace(/\*(.*?)\*/g, "$1");
      trimmed = trimmed.replace(/__(.*?)__/g, "$1");
      trimmed = trimmed.replace(/_(.*?)_/g, "$1");
      trimmed = trimmed.replace(/`([^`]+)`/g, "$1");
      trimmed = trimmed.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
      trimmed = trimmed.replace(/^[-*_]{3,}$/, "");
      trimmed = trimmed.replace(/^[-*_>]+\s*/, "");
      trimmed = trimmed.replace(/\*\*/g, "").replace(/\*/g, "");
      return trimmed;
    })
    .filter((line) => line.trim() !== "---" && line.trim() !== "***" && line.trim() !== "___")
    .join("\n");
};

// Renders markdown-ish report text safely (no dangerouslySetInnerHTML) by
// treating each line as plain text and preserving basic structure.
function MarkdownBody({ markdown }: { markdown: string }) {
  if (!markdown) return null;
  const lines = cleanMarkdownForPdf(markdown).split("\n");
  return (
    <div className="space-y-1.5">
      {lines.map((line, i) =>
        line.trim() === "" ? (
          <div key={i} className="h-2" />
        ) : (
          <p key={i} className="text-xs text-slate-600 leading-relaxed">
            {line}
          </p>
        )
      )}
    </div>
  );
}

export default function ResultsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const submissionId = searchParams.get("id");

  const [result, setResult] = useState<StoredScanResult | null>(null);
  const [loading, setLoading] = useState(true);

  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [unlockModalOpen, setUnlockModalOpen] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(searchParams.get("unlock") === "true");

  console.log("[Cost Frontend] Loading");

  const ctaUrl = ""; // TODO: wire up real CTA destination

  useEffect(() => {
    if (!submissionId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        console.log(`[Cost Frontend] Fetching data for ID: ${submissionId}`);
        // TODO: point this at the real endpoint that returns a StoredScanResult
        const res = await fetch(`/api/cost-scan/result?id=${encodeURIComponent(submissionId)}`);
        if (!res.ok) {
          const errorBody = await res.json().catch(() => ({ message: `Failed to load results (${res.status})` }));
          throw new Error(errorBody.message || `Failed to load results (${res.status})`);
        }
        const data: StoredScanResult = await res.json();
        console.log("Cost Audit Results Data:", data);
        if (!cancelled) setResult(data);
        console.log("[Cost Frontend] Success");
      } catch (err: any) {
        if (!cancelled) {
          console.error("Failed to load scan result", err);
          toast.error(err.message || "Failed to load scan results.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [submissionId]);

  const triggerPdfDownload = (id: string, data: StoredScanResult) => {
    // TODO: implement actual PDF generation/download using #cost-pdf-report-content
    console.log(`Downloading PDF for ${id}`, data);
  };

  if (loading) {
    return <ResultsSkeleton />;
  }

  if (!submissionId || !result) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-center p-6 gap-2">
        <h2 className="text-lg font-bold text-slate-900">We couldn\'t find that report</h2>
        <p className="text-sm text-slate-500 max-w-sm">
          The scan ID in your link may be invalid or expired. Please re-run the audit to get a new report.
        </p>
      </div>
    );
  }

  console.log("[Cost Frontend] Rendering");

   return (
     <Fragment>
       <main className="min-h-screen bg-[#fafbff] bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px] pb-12 overflow-x-hidden">
       {/* Contact Bar */}
       <ContactBar containerClassName="max-w-4xl" />

       {/* Nav Strip */}
       <motion.nav 
         variants={fadeIn} 
         initial="hidden" 
         animate="show"
          className="px-4 py-3"
       >
         <div className="max-w-4xl mx-auto flex items-center justify-between">
           <a href="/" className="flex items-center hover:opacity-80 transition-opacity">
             <Image src="/logo.jpg" alt="Pixel Punch" width={100} height={30} className="h-7 w-auto object-contain" />
           </a>
           <button
             onClick={() => router.push("/ai/cost-scan")}
             className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
           >
             New Scan
           </button>
         </div>
       </motion.nav>

       <motion.div 
         variants={staggerContainer}
         initial="hidden"
         animate="show"
         className="max-w-4xl mx-auto px-4 py-8 md:py-10 space-y-6 md:[zoom:1.06]"
       >
         {/* Header Block */}
         <motion.div 
           variants={slideUp}
           className="text-center mb-6"
         >
           <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 text-xs font-bold mb-3 shadow-sm animate-pulse">
             <span className="relative flex h-3 w-3">
               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-90 shadow-[0_0_12px_#10b981]"></span>
               <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-600 shadow-[0_0_10px_#10b981]"></span>
             </span>
             Audit Status: Live & Completed
           </div>
           <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-2">
             AI Cost Audit Results
           </h1>
           <p className="text-slate-600 text-sm">
             Customized for <strong className="text-slate-800">{result.contact?.firstname} {result.contact?.lastname}</strong>
     </p>
   </motion.div>

         <div className="grid gap-4 md:grid-cols-3">
             {([
               { title: "Spend Risk", dimension: "spend", score: result.scorecard?.spend },
               { title: "Architecture Risk", dimension: "architecture", score: result.scorecard?.architecture },
               { title: "Pain Risk", dimension: "pain", score: result.scorecard?.pain },
             ] as const).map((card, idx) => (
               <StatCard
                 key={idx}
                 title={card.title}
                 description={(scoreDescriptions as Record<string, Record<string, string>>)[card.dimension][card.score || "green"]}
                 ragStatus={card.score || "green"}
               />
             ))}
           </div>

         {result.insights && result.insights.length > 0 && (
             <div>
               <InsightsList
                 insights={result.insights}
                 submissionId={submissionId as string}
                 scanType="cost"
                 isUnlocked={isUnlocked}
                 onUnlock={() => setEmailModalOpen(true)}
               />
             </div>
         )}

         {result.recommendations && result.recommendations.length > 0 && (
           <div
             className="bg-green-500/30 rounded-lg border border-green-500/10 p-3 shadow-sm transition-all duration-300"
           >
             <h3 className="text-[10px] font-bold text-green-700 mb-1 flex items-center gap-1.5 uppercase tracking-wider">
               <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> Expert Recommendations
             </h3>
             <ul className="space-y-1">
               {result.recommendations.map((r, i) => (
                 <li
                   key={i}
                   className="text-xs text-slate-600 flex items-start gap-1.5 leading-normal transition-all duration-200 cursor-default"
                 >
                   <span className="text-green-500 font-bold">•</span>
                   <span>{r}</span>
                 </li>
               ))}
             </ul>
           </div>
         )}

         <div className="border border-slate-200 rounded-lg overflow-hidden relative">
            <div className={`bg-white p-4 prose prose-sm prose-slate max-w-none ${isUnlocked ? "" : "overflow-hidden max-h-[300px] min-h-[300px]"}`}>
                <div dangerouslySetInnerHTML={{ __html: result.auditReport || "" }} />
            </div>

           {!isUnlocked && <LockOverlay onUnlock={() => setUnlockModalOpen(true)} />}
         </div>

         {isUnlocked && (
           <Fragment>
             <SavingsProjection />
             <NinetyDayRoadmap />
             <OptimizationOpportunities />
           </Fragment>
         )}


         <div>
           <TierRecommendation tier={result.tier ?? 4} ctaUrl={ctaUrl} />
         </div>

         <div
           className="flex flex-wrap items-center justify-center gap-3 mt-8 pt-6 border-t border-slate-200"
         >
           <ShareResults />

           <button
             onClick={() => setEmailModalOpen(true)}
             className="inline-flex items-center justify-center px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs transition-all duration-200 shadow-sm gap-2 h-9 min-w-[150px]"
           >
             <Cpu className="w-3.5 h-3.5" />
             Email Audit Report
           </button>
         </div>

         <p className="text-center text-[10px] text-slate-400 mt-8">
           Scan ID: {result.submissionId}
         </p>
       </motion.div>
     </main>

       {isUnlocked && (
         <div className="fixed bottom-6 right-6 z-50">
           <button
             onClick={() => triggerPdfDownload(result.submissionId, result)}
             className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl flex items-center gap-2"
             title="Download PDF Report"
           >
             <Download className="w-5 h-5" />
           </button>
         </div>
       )}

       <UnlockModal
         isOpen={unlockModalOpen}
         onClose={() => setUnlockModalOpen(false)}
         onEmail={() => {
           setUnlockModalOpen(false);
           setEmailModalOpen(true);
         }}
       />

       {/* Hidden PDF report content, used as the source for PDF generation */}
       <div
         id="cost-pdf-report-content"
         data-json-data={JSON.stringify(result)}
         style={{
           position: "absolute",
           left: "-9999px",
           top: 0,
           width: "794px",
           backgroundColor: "#fff",
           padding: "32px",
           fontFamily: "system-ui, sans-serif",
           display: "none",
         }}
       >
         <div style={{ borderBottom: "2px solid #2563eb", paddingBottom: "16px", marginBottom: "24px" }}>
           <div style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a" }}>Pixel Punch AI — Cost Audit Report</div>
           <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>ID: {result.submissionId}</div>
         </div>

         <div style={{ marginBottom: "20px" }}>
           <div style={{ fontSize: "14px", fontWeight: 700, color: "#1e293b", marginBottom: "8px" }}>RAG Scorecard</div>
           <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
             <thead>
               <tr style={{ backgroundColor: "#f1f5f9" }}>
                 <th style={{ padding: "8px 12px", textAlign: "left", color: "#475569" }}>Dimension</th>
                 <th style={{ padding: "8px 12px", textAlign: "left", color: "#475569" }}>Rating</th>
               </tr>
             </thead>
             <tbody>
               {(
                 [
                   ["Spend & Visibility", result.scorecard.spend],
                   ["Architecture Risk", result.scorecard.architecture],
                   ["Business Pain", result.scorecard.pain],
                 ] as [string, string][]
               ).map(([label, val]) => (
                 <tr key={label} style={{ borderTop: "1px solid #e2e8f0" }}>
                   <td style={{ padding: "8px 12px", color: "#334155" }}>{label}</td>
                   <td
                     style={{
                       padding: "8px 12px",
                       fontWeight: 600,
                       color: val === "red" ? "#dc2626" : val === "amber" ? "#d97706" : "#16a34a",
                     }}
                   >
                     {RAG_META[val as "red" | "amber" | "green"].label}
                   </td>
                 </tr>
               ))}
             </tbody>
           </table>
         </div>

         {result.insights && result.insights.length > 0 && (
           <div style={{ marginBottom: "20px" }}>
             <div style={{ fontSize: "14px", fontWeight: 700, color: "#1e293b", marginBottom: "8px" }}>Key Insights</div>
             {result.insights.slice(0, 8).map((ins: any, i: number) => (
               <div key={i} style={{ fontSize: "12px", color: "#475569", padding: "4px 0", borderBottom: "1px solid #f1f5f9" }}>
                 • {typeof ins === "string" ? ins : ins.text || ins.title}
               </div>
             ))}
           </div>
         )}

         {result.auditReport && (
           <div style={{ marginBottom: "20px" }}>
             <div style={{ fontSize: "14px", fontWeight: 700, color: "#1e293b", marginBottom: "8px" }}>
               Full Technical Audit
             </div>
             <div className="prose prose-sm prose-slate max-w-none" style={{ fontSize: "11px", color: "#475569", lineHeight: 1.6 }}>
               <div dangerouslySetInnerHTML={{ __html: result.auditReport || "" }} />
             </div>
           </div>
         )}

         <div
           style={{
             borderTop: "1px solid #e2e8f0",
             paddingTop: "12px",
             fontSize: "10px",
             color: "#94a3b8",
             textAlign: "center",
           }}
         >
           Generated by Pixel Punch AI · pixelpunch.org · © 2026 Pixel Punch
         </div>
       </div>

       <EmailModal
         isOpen={emailModalOpen}
         onClose={() => setEmailModalOpen(false)}
         submissionId={result.submissionId}
         scanType="cost"
         defaultEmail={result.contact?.email ?? ""}
       />
     </Fragment>
   );
}
