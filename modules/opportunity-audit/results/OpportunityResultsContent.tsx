"use client";

import { Fragment, useEffect, useState } from "react";
import * as motion from "framer-motion/client";
import toast from "react-hot-toast";

import { useSearchParams, useRouter } from "next/navigation";

import Image from "next/image";
 import { Cpu, Download, CheckCircle2 } from "lucide-react";
import { RAG_META, Rag } from "@/shared/utils/rag-styles";

import { ContactBar } from "@/shared/components/ContactBar";


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

// Define a type for the opportunity scan result, assuming a similar structure to StoredScanResult
interface StoredOpportunityResult {
  submissionId: string;
  scorecard: {
    spend: "red" | "amber" | "green";
    architecture: "red" | "amber" | "green";
    pain: "red" | "amber" | "green";
  };
  insights: any[]; // Adjust as per actual structure
  recommendations: string[]; // Adjust as per actual structure
  auditReport: string;
  contact?: {
    firstname: string;
    lastname: string;
    email: string;
  };
  tier?: 2 | 1 | 3 | 4;
}

const getRagStatusFromTier = (tier: number): Rag => {
  if (tier === 1) return "green";
  if (tier === 2) return "amber";
  return "red"; // For tier 3 and 4, or any other unexpected value
};

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

  const [result, setResult] = useState<StoredOpportunityResult | null>(null);
  const [loading, setLoading] = useState(true);

  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [unlockModalOpen, setUnlockModalOpen] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);

  console.log("[Opportunity Frontend] Loading");
  console.log("Submission ID from searchParams:", submissionId);

  const ctaUrl = ""; // TODO: wire up real CTA destination

  useEffect(() => {
    if (!submissionId) {
      setLoading(false);
      console.log("No submission ID found, setting loading to false.");
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        console.log(`[Opportunity Frontend] Fetching data for ID: ${submissionId}`);
        // TODO: point this at the real endpoint that returns a StoredOpportunityResult
        const res = await fetch(`/api/opportunity-scan/result?id=${encodeURIComponent(submissionId)}`);
        if (!res.ok) {
          const errorBody = await res.json().catch(() => ({ message: `Failed to load results (${res.status})` }));
          throw new Error(errorBody.message || `Failed to load results (${res.status})`);
        }
        const data: StoredOpportunityResult = await res.json();
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

  const triggerPdfDownload = async (id: string, data: StoredOpportunityResult) => {
    const element = document.getElementById("opportunity-pdf-report-content");
    if (element) {
      // Make the hidden content visible for PDF generation
      element.style.display = "block";
      if (typeof window !== 'undefined') {
        const html2pdf = (await import('html2pdf.js')).default;
        html2pdf().from(element).set({
        margin: 10,
        filename: `opportunity-audit-report-${id}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      }).save().then(() => {
        // Hide the content again after PDF generation
        element.style.display = "none";
      });
    }
    } else {
      toast.error("Could not find report content for PDF generation.");
    }
  };

  if (loading) {
    return <ResultsSkeleton />;
  }

  if (!submissionId || !result) {
    console.log("Rendering 'We couldn't find that report' - submissionId:", submissionId, "result:", result);
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
       <EmailModal
         isOpen={emailModalOpen}
         onClose={() => setEmailModalOpen(false)}
         onSuccess={() => {
           setEmailModalOpen(false);
           toast.success("Thank you! Your report has been sent.");
         }}
         submissionId={submissionId}
         scanType="opportunity"
       />
       <UnlockModal
         isOpen={unlockModalOpen}
         onClose={() => setUnlockModalOpen(false)}
         onEmail={() => {
           setUnlockModalOpen(false);
           setEmailModalOpen(true);
           setIsUnlocked(true);
         }}
       />
       <motion.nav
         variants={fadeIn}
         initial="hidden"
         animate="show"
         className="w-full flex items-center py-6"
       >
         <div className="w-full flex justify-between items-center max-w-6xl mx-auto">
           <Image
             src="/Pixelpunch_logo2.png"
             alt="PixelPunch Logo"
             width={150}
             height={30}
             className="h-auto"
             priority
           />
           <ContactBar />
         </div>
       </motion.nav>

       <motion.div
         variants={staggerContainer}
         initial="hidden"
         animate="show"
         className="relative z-0 max-w-6xl mx-auto min-h-[80vh] bg-white shadow-lg rounded-lg p-6 mb-10"
       >
         {!isUnlocked && <LockOverlay onUnlock={() => setUnlockModalOpen(true)} />}

         <motion.div variants={slideUp} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
           <div>
             <h1 className="text-2xl font-bold text-slate-800">RAG Scorecard Overview</h1>
             <p className="text-slate-500">
               A summary of your current cloud and AI spend efficiency.
             </p>
           </div>
           <button
             onClick={() => triggerPdfDownload(submissionId, result)}
             className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
           >
             <Download size={16} /> Download Report
           </button>
         </motion.div>

         <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
           <StatCard
             title="Spend & Visibility"
             ragStatus={result.scorecard.spend}
             description="Measures your cloud & AI spend efficiency and visibility gaps across providers."
           />
           <StatCard
             title="Architecture Risk"
             ragStatus={result.scorecard.architecture}
             description="Evaluates architectural decisions that drive unnecessary cost or technical debt."
           />
           <StatCard
             title="Business Pain & Urgency"
             ragStatus={result.scorecard.pain}
             description="Assesses operational pain, urgency, and business impact of current inefficiencies."
           />
         </div>

         <div className="mb-10">
           <h2 className="text-xl font-bold text-slate-800 mb-4">Key Insights</h2>
           <InsightsList insights={result.insights} submissionId={submissionId} scanType="opportunity" />
         </div>

         <div className="mb-10">
           <h2 className="text-xl font-bold text-slate-800 mb-4">Recommendations</h2>
           <TierRecommendation tier={result.tier || 1} ctaUrl={ctaUrl} />
           <div className="space-y-4 mt-4">
             {result.recommendations.map((rec, i) => (
               <div key={i} className="flex items-start gap-3">
                 <CheckCircle2 size={20} className="text-green-500 flex-shrink-0 mt-1" />
                 <p className="text-slate-700">{rec}</p>
               </div>
             ))}
           </div>
         </div>

         <ShareResults />
       </motion.div>

       {/* Hidden content for PDF generation */}
       <div id="opportunity-pdf-report-content" className="hidden p-8" style={{ width: "210mm", minHeight: "297mm", fontSize: "10pt", fontFamily: "sans-serif", lineHeight: "1.5" }}>
         <div className="text-center mb-8">
           <Image
             src="/Pixelpunch_logo2.png"
             alt="PixelPunch Logo"
             width={150}
             height={30}
             style={{ margin: "0 auto", filter: "none" }}
             priority
           />
           <h1 style={{ fontSize: "24pt", fontWeight: "bold", margin: "16pt 0 8pt 0", color: "#334155" }}>RAG Scorecard Audit Report</h1>
           <p style={{ fontSize: "10pt", color: "#64748b" }}>Report ID: {submissionId}</p>
         </div>

         <div style={{ marginBottom: "24pt" }}>
           <h2 style={{ fontSize: "16pt", fontWeight: "bold", marginBottom: "8pt", color: "#334155" }}>Overview</h2>
           <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "16pt" }}>
             <thead>
               <tr style={{ backgroundColor: "#f1f5f9" }}>
                 <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: "bold", color: "#334155" }}>Category</th>
                 <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: "bold", color: "#334155" }}>Risk Level</th>
                 <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: "bold", color: "#334155" }}>Description</th>
               </tr>
             </thead>
             <tbody>
               <tr>
                 <td style={{ padding: "8px 12px", fontWeight: 600, color: "#334155" }}>Spend & Visibility</td>
                 <td
                   style={{
                     padding: "8px 12px",
                     fontWeight: 600,
                     color: RAG_META[result.scorecard.spend].dotColor,
                   }}
                 >
                   {RAG_META[result.scorecard.spend].label}
                 </td>
                 <td style={{ padding: "8px 12px", fontSize: "9pt", color: "#475569" }}>
                   {scoreDescriptions.spend[result.scorecard.spend]}
                 </td>
               </tr>
               <tr>
                 <td style={{ padding: "8px 12px", fontWeight: 600, color: "#334155" }}>Architecture Risk</td>
                 <td
                   style={{
                     padding: "8px 12px",
                     fontWeight: 600,
                     color: RAG_META[result.scorecard.architecture].dotColor,
                   }}
                 >
                   {RAG_META[result.scorecard.architecture].label}
                 </td>
                 <td style={{ padding: "8px 12px", fontSize: "9pt", color: "#475569" }}>
                   {scoreDescriptions.architecture[result.scorecard.architecture]}
                 </td>
               </tr>
               <tr>
                 <td style={{ padding: "8px 12px", fontWeight: 600, color: "#334155" }}>Business Pain & Urgency</td>
                 <td
                   style={{
                     padding: "8px 12px",
                     fontWeight: 600,
                     color: RAG_META[result.scorecard.pain].dotColor,
                   }}
                 >
                   {RAG_META[result.scorecard.pain].label}
                 </td>
                 <td style={{ padding: "8px 12px", fontSize: "9pt", color: "#475569" }}>
                   {scoreDescriptions.pain[result.scorecard.pain]}
                 </td>
               </tr>
             </tbody>
           </table>
         </div>

         <div style={{ marginBottom: "24pt" }}>
           <h2 style={{ fontSize: "16pt", fontWeight: "bold", marginBottom: "8pt", color: "#334155" }}>Key Insights</h2>
           {result.insights.map((insight: any, i: number) => (
             <div key={i} style={{ marginBottom: "12pt" }}>
               <h3 style={{ fontSize: "12pt", fontWeight: "bold", marginBottom: "4pt", color: "#334155" }}>{insight.title}</h3>
               <MarkdownBody markdown={insight.description} />
             </div>
           ))}
         </div>

         <div style={{ marginBottom: "24pt" }}>
           <h2 style={{ fontSize: "16pt", fontWeight: "bold", marginBottom: "8pt", color: "#334155" }}>Recommendations</h2>
             <h3 style={{ fontSize: "12pt", fontWeight: "bold", marginBottom: "4pt", color: "#334155" }}>
               {RAG_META[getRagStatusFromTier(result.tier || 1)].label} Tier Recommendation
             </h3>
             <p style={{ fontSize: "10pt", color: "#475569", marginBottom: "12pt" }}>
               {/* Removed scoreDescriptions.tier[result.tier || 1] as it's not needed */}
             </p>
           {result.recommendations.map((rec: string, i: number) => (
             <div key={i} style={{ display: "flex", alignItems: "flex-start", marginBottom: "8pt" }}>
               <span style={{ color: "#22c55e", marginRight: "8pt", fontSize: "12pt" }}>✔</span>
               <p style={{ fontSize: "10pt", color: "#475569" }}>{rec}</p>
             </div>
           ))}
         </div>

         <div style={{ fontSize: "9pt", color: "#64748b", textAlign: "center", paddingTop: "24pt", borderTop: "1px solid #e2e8f0" }}>
           <p>Generated by PixelPunch AI Audit</p>
           <p>Contact us at info@pixelpunch.com</p>
         </div>
       </div>
     </Fragment>
   );
}
