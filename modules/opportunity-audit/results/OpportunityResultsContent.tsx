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
     <div>
       <h1>Hello from OpportunityResultsContent!</h1>
     </div>
   );
}
