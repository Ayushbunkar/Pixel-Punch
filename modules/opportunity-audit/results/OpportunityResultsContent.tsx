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
    <div className="min-h-screen bg-white text-slate-800">
      <header className="bg-blue-600 text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-3xl font-bold">Opportunity Audit Report</h1>
          {result?.contact && (
            <div className="text-right">
              <p className="text-sm">{result.contact.firstname} {result.contact.lastname}</p>
              <p className="text-sm">{result.contact.email}</p>
            </div>
          )}
        </div>
      </header>

      <main className="container mx-auto p-6 space-y-8">
        <section className="bg-blue-50 p-6 rounded-lg shadow-sm">
          <h2 className="text-2xl font-semibold text-blue-800 mb-4">Overall Scorecard</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.entries(result?.scorecard || {}).map(([key, value]) => (
              <div key={key} className="flex flex-col items-center p-4 bg-white rounded-lg shadow-md">
                <p className="text-lg font-medium capitalize">{key}</p>
                <span className={`text-3xl font-bold mt-2
                  ${value === "red" ? "text-red-500" : ""}
                  ${value === "amber" ? "text-yellow-500" : ""}
                  ${value === "green" ? "text-green-500" : ""}
                `}>
                  {value.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-blue-50 p-6 rounded-lg shadow-sm">
          <h2 className="text-2xl font-semibold text-blue-800 mb-4">Audit Report</h2>
          <div className="bg-white p-4 rounded-lg shadow-inner">
            <p className="text-slate-700 whitespace-pre-wrap">{result?.auditReport}</p>
          </div>
        </section>

        {result?.insights && result.insights.length > 0 && (
          <section className="bg-blue-50 p-6 rounded-lg shadow-sm">
            <h2 className="text-2xl font-semibold text-blue-800 mb-4">Key Insights</h2>
            <ul className="list-disc list-inside bg-white p-4 rounded-lg shadow-inner space-y-2">
              {result.insights.map((insight, index) => (
                <li key={index} className="text-slate-700">{insight}</li>
              ))}
            </ul>
          </section>
        )}

        {result?.recommendations && result.recommendations.length > 0 && (
          <section className="bg-blue-50 p-6 rounded-lg shadow-sm">
            <h2 className="text-2xl font-semibold text-blue-800 mb-4">Recommendations</h2>
            <ul className="list-disc list-inside bg-white p-4 rounded-lg shadow-inner space-y-2">
              {result.recommendations.map((rec, index) => (
                <li key={index} className="text-slate-700">{rec}</li>
              ))}
            </ul>
          </section>
        )}
      </main>

      <footer className="bg-blue-600 text-white p-4 text-center shadow-inner mt-8">
        <p>&copy; {new Date().getFullYear()} Pixel Punch. All rights reserved.</p>
      </footer>
    </div>
  );
}
