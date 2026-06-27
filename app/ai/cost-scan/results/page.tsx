import type { Metadata } from "next";
import { Suspense } from "react";
import ResultsPageContent from "@/modules/cost-audit/results/ResultsPageContent";

export const metadata: Metadata = {
  title: "Your AI Cost Scan Results | Pixel Punch AI",
  description:
    "Your personalised AI cost scorecard — spend visibility, architecture risk, and business urgency — with tailored insights and a next-step recommendation.",
  robots: { index: false, follow: false }, // Results are private; don't index
};

export default function ResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#eef4ff] flex items-center justify-center">
          <div className="w-10 h-10 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
        </div>
      }
    >
      <ResultsPageContent />
    </Suspense>
  );
}
