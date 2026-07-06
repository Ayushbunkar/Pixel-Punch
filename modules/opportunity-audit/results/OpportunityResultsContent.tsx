"use client";

import { Fragment, useEffect, useState } from "react";
import toast from "react-hot-toast";

import { useSearchParams, useRouter } from "next/navigation";

import { StoredScanResult } from "@/modules/opportunity-audit/types";
import Image from "next/image";

import { Cpu, Download, CheckCircle2 } from "lucide-react";
import { RAG_META } from "@/shared/utils/rag-styles";

import { ContactBar } from "@/shared/components/ContactBar";

import * as motion from "framer-motion/client";

import { slideUp, staggerContainer, fadeIn } from "@/shared/components/animations";

import { StatCard } from "@/shared/components/StatCard";
import scoreDescriptions from "@/shared/config/score-descriptions.json";

import { InsightsList } from "@/modules/cost-audit/results/InsightsList";

import { TierRecommendation } from "@/modules/cost-audit/results/TierRecommendation";

import { ShareResults } from "@/modules/cost-audit/results/ShareResults";

import { ResultsSkeleton } from "@/modules/cost-audit/results/ResultsSkeleton";

import { EmailModal } from "@/shared/components/EmailModal";
import { UnlockModal } from "@/shared/components/UnlockModal";
import { LockOverlay } from "@/shared/components/LockOverlay";

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
      trimmed = trimmed.replace(/^[*-_>]+\s*/, "");
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

export default function OpportunityResultsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const submissionId = searchParams.get("id");

  const [result, setResult] = useState<StoredScanResult | null>(null);
  const [loading, setLoading] = useState(true);

  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);

  console.log("[Opportunity Frontend] Loading");

  const ctaUrl = ""; // TODO: wire up real CTA destination

  useEffect(() => {
    if (!submissionId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        console.log(`[Opportunity Frontend] Fetching data for ID: ${submissionId}`);
        const res = await fetch(`/api/opportunity-scan/result?id=${encodeURIComponent(submissionId)}`);
        if (!res.ok) {
          const errorBody = await res.json().catch(() => ({ message: `Failed to load results (${res.status})` }));
          throw new Error(errorBody.message || `Failed to load results (${res.status})`);
        }
        const data: StoredScanResult = await res.json();
        console.log("Opportunity Audit Results Data:", data);
        if (!cancelled) setResult(data);
        console.log("[Opportunity Frontend] Success");
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
    // TODO: implement actual PDF generation/download using #opportunity-pdf-report-content
    console.log(`Downloading PDF for ${id}`, data);
  };

  if (loading) {
    return <ResultsSkeleton />;
  }

  if (!submissionId || !result) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-center p-6 gap-2">
        <h2 className="text-lg font-bold text-slate-900">We couldn't find that report</h2>
        <p className="text-sm text-slate-500 max-w-sm">
          The scan ID in your link may be invalid or expired. Please re-run the audit to get a new report.
        </p>
      </div>
    );
  }

  console.log("[Opportunity Frontend] Rendering");

   return (
     <Fragment>
       <main className="min-h-screen bg-[#fafbff] pb-12 overflow-x-hidden">
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
             onClick={() => router.push("/ai/opportunity-scan")}
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
              AI Opportunity Audit Results
           </h1>
           <p className="text-slate-600 text-sm">
             Customized for <strong className="text-slate-800">{result.contact?.firstname && result.contact?.lastname ? `${result.contact.firstname} ${result.contact.lastname}${result.contact.company ? ` from ${result.contact.company}` : ''}` : "Guest"}</strong>
     </p>
   </motion.div>

          {result.scorecard && (
            <div className="grid gap-4 md:grid-cols-3">
                {([
                   { title: "Readiness Risk", dimension: "readiness", score: result.scorecard.readiness },
                   { title: "Value Risk", dimension: "value", score: result.scorecard.value },
                   { title: "Opportunity Risk", dimension: "opportunity", score: result.scorecard.opportunity },
                ] as const).map((card, idx) => (
                  <StatCard
                    key={idx}
                    title={card.title}
                    description={(scoreDescriptions as Record<string, Record<string, string>>)[card.dimension][card.score || "green"]}
                    ragStatus={card.score || "green"}
                  />
                ))}
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

          {result.insights && result.insights.length > 0 && (
            <div className="border border-slate-200 rounded-lg overflow-hidden relative">
              <div className="bg-white p-3 overflow-y-auto scrollbar-thin max-h-[300px] min-h-[150px]">
                <InsightsList
                  insights={result.insights}
                  submissionId={submissionId as string}
                  scanType="opportunity"
                />
              </div>
              {!isUnlocked && (
                <LockOverlay
                  onUnlock={() => setEmailModalOpen(true)}
                  title="KEY INSIGHTS LOCKED"
                  description="Unlock to view detailed insights."
                />
              )}
            </div>
          )}

           {result.auditReport && (
             <div className="mt-6">
               <h2 className="text-xl font-bold text-slate-900 mb-4">Full Technical Audit Report</h2>
               <div className="border border-slate-200 rounded-lg overflow-hidden relative">
                 <div className="bg-white p-4 rounded-lg shadow-sm">
                   <MarkdownBody markdown={result.auditReport} />
                 </div>
                 {!isUnlocked && (
                   <LockOverlay
                     onUnlock={() => setEmailModalOpen(true)}
                     title="FULL TECHNICAL AUDIT REPORT LOCKED"
                     description="Unlock to view the complete report."
                   />
                 )}
               </div>
             </div>
           )}



         <p className="text-center text-[10px] text-slate-400 mt-8">
           Scan ID: {result.submissionId}
         </p>
       </motion.div>
     </main>

       {isUnlocked && (
         <div className="fixed bottom-6 right-6 z-50">
           <button
             onClick={() => triggerPdfDownload(result.submissionId || "", result)}
             className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl flex items-center gap-2"
             title="Download PDF Report"
           >
             <Download className="w-5 h-5" />
           </button>
         </div>
       )}



       {/* Hidden PDF report content, used as the source for PDF generation */}
       <div
         id="opportunity-pdf-report-content"
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
           <div style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a" }}>Pixel Punch AI — Opportunity Audit Report</div>
           <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>ID: {result.submissionId}</div>
         </div>

         {result.scorecard && (
           <div style={{ marginBottom: "20px" }}>
             <div style={{ fontSize: "14px", fontWeight: 700, color: "#1e293b", marginBottom: "8px" }}>RAG Scorecard</div>
             <div style={{ display: "flex", gap: "16px" }}>
                 {(
                   [
                     { title: "Readiness Risk", dimension: "readiness", score: result.scorecard.readiness },
                     { title: "Value Risk", dimension: "value", score: result.scorecard.value },
                     { title: "Opportunity Risk", dimension: "opportunity", score: result.scorecard.opportunity },
                   ] as const
                 ).map((cardItem) => {
                   const ragStatus = cardItem.score || "green";
                   const description = (scoreDescriptions as Record<string, Record<string, string>>)[cardItem.dimension][ragStatus];

                   const ragStyles = {
                     red: {
                       bgColor: "#fee2e2",
                       borderColor: "#fca5a5",
                       titleColor: "#b91c1c",
                       labelColor: "#ef4444",
                       descriptionColor: "#ef4444",
                       badgeBg: "#fca5a5",
                       badgeText: "#b91c1c",
                       statusText: "HIGH RISK",
                       icon: "⚠️",
                     },
                     amber: {
                       bgColor: "#fffbeb",
                       borderColor: "#fcd34d",
                       titleColor: "#b45309",
                       labelColor: "#f59e0b",
                       descriptionColor: "#f59e0b",
                       badgeBg: "#fcd34d",
                       badgeText: "#b45309",
                       statusText: "NEEDS ATTENTION",
                       icon: "💡",
                     },
                     green: {
                       bgColor: "#ecfdf5",
                       borderColor: "#a7f3d0",
                       titleColor: "#047857",
                       labelColor: "#10b981",
                       descriptionColor: "#10b981",
                       badgeBg: "#a7f3d0",
                       badgeText: "#047857",
                       statusText: "GOOD",
                       icon: "✅",
                     },
                   };

                   const currentRagStyle = ragStyles[ragStatus as keyof typeof ragStyles];

                   return (
                     <div
                       key={cardItem.dimension}
                       style={{
                         flex: 1,
                         backgroundColor: currentRagStyle.bgColor,
                         border: `1px solid ${currentRagStyle.borderColor}`,
                         borderRadius: "8px",
                         padding: "20px", // Increased padding to match image
                         display: "flex",
                         flexDirection: "column",
                         gap: "10px", // Adjusted gap
                         position: "relative", // For absolute positioning of badge
                       }}
                     >
                       <div style={{ fontSize: "12px", fontWeight: 700, color: currentRagStyle.titleColor, textTransform: "uppercase", marginBottom: "4px" }}>
                         {cardItem.title}
                       </div>
                       <div style={{ fontSize: "16px", fontWeight: 800, color: currentRagStyle.labelColor, marginBottom: "2px" }}>
                         {currentRagStyle.statusText}
                       </div>
                       <div style={{ fontSize: "28px", fontWeight: 900, color: currentRagStyle.labelColor, lineHeight: 1 }}>
                         {ragStatus.toUpperCase()}
                       </div>
                       <div
                         style={{
                           backgroundColor: currentRagStyle.badgeBg,
                           color: currentRagStyle.badgeText,
                           padding: "4px 8px",
                           borderRadius: "4px",
                           fontSize: "10px",
                           fontWeight: 700,
                           textTransform: "uppercase",
                           display: "inline-block",
                           marginTop: "8px",
                           width: "fit-content",
                         }}
                       >
                         {ragStatus.toUpperCase()}
                       </div>
                       <div style={{ fontSize: "12px", color: "#475569", lineHeight: 1.5, marginTop: "12px" }}>
                         {description}
                       </div>
                     </div>
                   );
                 })}
             </div>
           </div>
         )}

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
             <div style={{ fontSize: "11px", color: "#475569", whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
               {/* Removed MarkdownBody usage */ result.auditReport}
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
         submissionId={result.submissionId || ""}
         scanType="opportunity"
         defaultEmail={result.contact?.email ?? ""}
       />
     </Fragment>
   );
}
