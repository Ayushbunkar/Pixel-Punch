import type { Metadata } from "next";
import { Suspense } from "react";
import OpportunityResultsContent from "@/modules/opportunity-audit/results/OpportunityResultsContent";

export const metadata: Metadata = {
  title: "Your AI Opportunity Audit Results | Pixel Punch AI",
  description:
    "Your personalized AI Opportunity Roadmap — featuring Readiness Scorecard, custom recommendations, and a phased implementation roadmap.",
  robots: { index: false, follow: false },
};

export default function OpportunityResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#fafbff] flex items-center justify-center">
          <div className="w-10 h-10 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        </div>
      }
    >
      <OpportunityResultsContent />
    </Suspense>
  );
}
