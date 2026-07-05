"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ResultsSkeleton } from "@/modules/cost-audit/results/ResultsSkeleton";

export default function OpportunityResultsContent() {
  const searchParams = useSearchParams();
  const submissionId = searchParams.get("id");

  const [loading, setLoading] = useState(true);
interface StoredOpportunityResult {
  submissionId: string;
  scorecard: {
    spend: "red" | "amber" | "green";
    architecture: "red" | "amber" | "green";
    pain: "red" | "amber" | "green";
  };
  insights: any[];
  recommendations: string[];
  auditReport: string;
  contact?: {
    firstname: string;
    lastname: string;
    email: string;
  };
  tier?: 2 | 1 | 3 | 4;
}

const [result, setResult] = useState<StoredOpportunityResult | null>(null);

  useEffect(() => {
    if (!submissionId) {
      setLoading(false);
      console.log("No submission ID found, setting loading to false.");
      return;
    }

    // Simulate fetching data
    setTimeout(() => {
      setResult({
        submissionId: submissionId,
        scorecard: {
          spend: "red",
          architecture: "amber",
          pain: "green",
        },
        insights: [],
        recommendations: [],
        auditReport: "This is a dummy report.",
      });
      setLoading(false);
      console.log("Simulated data fetch complete.");
    }, 1000);
  }, [submissionId]);

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

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Opportunity Results Content</h1>
      <p>Submission ID: {submissionId}</p>
      <p>Report content will go here.</p>
    </div>
  );
}
