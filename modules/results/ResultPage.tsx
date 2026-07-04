"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";

import { ContactBar } from "@/shared/components/ContactBar";
import * as motion from "framer-motion/client";
import { slideUp, staggerContainer, fadeIn } from "@/shared/components/animations";

import { ArrowLeft } from "lucide-react";
import { StatCard } from "@/shared/components/StatCard";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { UnlockModal } from "@/shared/components/UnlockModal"; // Added
import { LockOverlay } from "@/shared/components/LockOverlay"; // Added

type Rag = "red" | "amber" | "green";

interface ResultData {
  id: string;
  executiveSummary: string;
  overallScore: {
    ragStatus: Rag;
    scoreValue: number;
    description: string;
  };
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  riskAnalysis: {
    summary: string;
    risks: Array<{
      title: string;
      description: string;
      ragStatus: Rag;
    }>;
  };
  improvementOpportunities: Array<{
    title: string;
    description: string;
    category: string;
    ragStatus: Rag;
  }>;
  detailedAiAnalysis: string;
  finalVerdict: string;
  additionalNotes: string;
}


export default function ResultPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [loading, setLoading] = useState(true);
  const [resultData, setResultData] = useState<ResultData | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false); // Added
  const [unlockModalOpen, setUnlockModalOpen] = useState(false); // Added

  useEffect(() => {
    if (!id) {
      toast.error("No result ID found in URL.");
      setLoading(false);
      return;
    }

    const fetchResult = async () => {
      try {
        const response = await fetch(`/api/opportunity-scan/result?id=${id}`);
        if (!response.ok) {
          throw new Error("Result not found.");
        }
        const json = await response.json();
        setResultData(json);
      } catch (err: any) {
        toast.error(err.message || "Failed to load result data. Redirecting...");
        router.push("/"); // Redirect to home or a suitable error page
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [id, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafbff] flex flex-col items-center justify-center p-6">
        <div className="w-10 h-10 rounded-full border-4 border-blue-600 border-t-transparent animate-spin mb-3" />
        <p className="text-xs font-semibold text-slate-600 animate-pulse">Loading AI Audit Result...</p>
      </div>
    );
  }

  if (!resultData) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-center p-6 gap-2">
        <h2 className="text-lg font-bold text-slate-900">Result not found</h2>
        <p className="text-sm text-slate-500 max-w-sm">
          The requested AI audit result could not be loaded. Please try again or check the ID.
        </p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#fafbff] pb-12 overflow-x-hidden">
      {/* Contact Bar */}
      <ContactBar containerClassName="max-w-4xl" />

      {/* Nav Strip */}
      <motion.nav
        variants={fadeIn}
        initial="hidden"
        animate="show"
        className="border-b border-slate-200 px-4 py-3 bg-white/50 backdrop-blur-md"
      >
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <a href="/" className="flex items-center hover:opacity-80 transition-opacity">
            <Image src="/logo.jpg" alt="Pixel Punch" width={100} height={30} className="h-7 w-auto object-contain" />
          </a>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
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
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
            AI Audit Results
          </h1>
          <p className="text-slate-600 text-sm">
            Customized for ID: <strong className="text-slate-800">{resultData.id}</strong>
          </p>
        </motion.div>

        {/* Overall Score */}
        <motion.div variants={slideUp}>
          <StatCard
            title="Overall AI Health Score"
            description={resultData.overallScore.description}
            ragStatus={resultData.overallScore.ragStatus}
          />
        </motion.div>

        {/* Executive Summary */}
        <motion.div variants={slideUp} className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
          <h2 className="text-md font-bold text-slate-900 mb-2">Executive Summary</h2>
          <p className="text-sm text-slate-600 leading-relaxed">{resultData.executiveSummary}</p>
        </motion.div>

        {/* Strengths */}
        {resultData.strengths.length > 0 && (
          <motion.div variants={slideUp} className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
            <h2 className="text-md font-bold text-slate-900 mb-2">Strengths</h2>
            <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
              {resultData.strengths.map((strength, index) => (
                <li key={index}>{strength}</li>
              ))}
            </ul>
          </motion.div>
        )}

        {/* Weaknesses */}
        {resultData.weaknesses.length > 0 && (
          <motion.div variants={slideUp} className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
            <h2 className="text-md font-bold text-slate-900 mb-2">Weaknesses</h2>
            <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
              {resultData.weaknesses.map((weakness, index) => (
                <li key={index}>{weakness}</li>
              ))}
            </ul>
          </motion.div>
        )}

        {/* Recommendations */}
        {resultData.recommendations.length > 0 && (
          <motion.div variants={slideUp} className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
            <h2 className="text-md font-bold text-slate-900 mb-2">Recommendations</h2>
            <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
              {resultData.recommendations.map((recommendation, index) => (
                <li key={index}>{recommendation}</li>
              ))}
            </ul>
          </motion.div>
        )}

        {/* Risk Analysis */}
        <div className="relative">
          <motion.div variants={slideUp} className={`bg-white rounded-lg border border-slate-200 p-4 shadow-sm ${!isUnlocked ? "blur-sm select-none pointer-events-none opacity-40" : ""}`}>
            <h2 className="text-md font-bold text-slate-900 mb-2">Risk Analysis</h2>
            <p className="text-sm text-slate-600 leading-relaxed mb-4">{resultData.riskAnalysis.summary}</p>
            <div className="grid gap-4 md:grid-cols-2">
              {resultData.riskAnalysis.risks.map((risk, index) => (
                <StatCard
                  key={index}
                  title={risk.title}
                  description={risk.description}
                  ragStatus={risk.ragStatus}
                />
              ))}
            </div>
          </motion.div>
          {!isUnlocked && (
            <LockOverlay
              onUnlock={() => setUnlockModalOpen(true)}
              title="Unlock Full Risk Analysis"
              description="Enter your email to unlock the detailed risk analysis and mitigation strategies."
              buttonText="Unlock Analysis"
            />
          )}
        </div>

        {/* Improvement Opportunities */}
        <div className="relative">
          {resultData.improvementOpportunities.length > 0 && (
            <motion.div variants={slideUp} className={`bg-white rounded-lg border border-slate-200 p-4 shadow-sm ${!isUnlocked ? "blur-sm select-none pointer-events-none opacity-40" : ""}`}>
              <h2 className="text-md font-bold text-slate-900 mb-2">Improvement Opportunities</h2>
              <div className="grid gap-4 md:grid-cols-1">
                {resultData.improvementOpportunities.map((opportunity, index) => (
                  <StatCard
                    key={index}
                    title={opportunity.title}
                    description={opportunity.description}
                    ragStatus={opportunity.ragStatus}
                  />
                ))}
              </div>
            </motion.div>
          )}
          {!isUnlocked && (
            <LockOverlay
              onUnlock={() => setUnlockModalOpen(true)}
              title="Unlock Improvement Opportunities"
              description="Enter your email to unlock detailed improvement opportunities and their impact."
              buttonText="Unlock Opportunities"
            />
          )}
        </div>

        {/* Detailed AI Analysis */}
        <div className="relative">
          <motion.div variants={slideUp} className={`bg-white rounded-lg border border-slate-200 p-4 shadow-sm ${!isUnlocked ? "blur-sm select-none pointer-events-none opacity-40" : ""}`}>
            <h2 className="text-md font-bold text-slate-900 mb-2">Detailed AI Analysis</h2>
            <p className="text-sm text-slate-600 leading-relaxed">{resultData.detailedAiAnalysis}</p>
          </motion.div>
          {!isUnlocked && (
            <LockOverlay
              onUnlock={() => setUnlockModalOpen(true)}
              title="Unlock Detailed AI Analysis"
              description="Enter your email to unlock the comprehensive AI analysis."
              buttonText="Unlock Analysis"
            />
          )}
        </div>

        {/* Final Verdict */}
        <div className="relative">
          <motion.div variants={slideUp} className={`bg-white rounded-lg border border-slate-200 p-4 shadow-sm ${!isUnlocked ? "blur-sm select-none pointer-events-none opacity-40" : ""}`}>
            <h2 className="text-md font-bold text-slate-900 mb-2">Final Verdict</h2>
            <p className="text-sm text-slate-600 leading-relaxed">{resultData.finalVerdict}</p>
          </motion.div>
          {!isUnlocked && (
            <LockOverlay
              onUnlock={() => setUnlockModalOpen(true)}
              title="Unlock Final Verdict"
              description="Enter your email to unlock the final verdict and expert recommendations."
              buttonText="Unlock Verdict"
            />
          )}
        </div>

        {/* Additional Notes */}
        <div className="relative">
          <motion.div variants={slideUp} className={`bg-white rounded-lg border border-slate-200 p-4 shadow-sm ${!isUnlocked ? "blur-sm select-none pointer-events-none opacity-40" : ""}`}>
            <h2 className="text-md font-bold text-slate-900 mb-2">Additional Notes</h2>
            <p className="text-sm text-slate-600 leading-relaxed">{resultData.additionalNotes}</p>
          </motion.div>
          {!isUnlocked && (
            <LockOverlay
              onUnlock={() => setUnlockModalOpen(true)}
              title="Unlock Additional Notes"
              description="Enter your email to unlock the additional expert notes and insights."
              buttonText="Unlock Notes"
            />
          )}
        </div>

      </motion.div>

      {/* Footer */}
      <div className="mt-12 py-8 text-center text-xs text-slate-400 border-t border-slate-200">
        <p>Generated by Pixel Punch AI &nbsp;·&nbsp; pixelpunch.org &nbsp;·&nbsp; © 2026 Pixel Punch</p>
      </div>

      {/* Unlock Modal */}
      <UnlockModal
        isOpen={unlockModalOpen}
        onClose={() => setUnlockModalOpen(false)}
        onEmail={() => {
          setUnlockModalOpen(false);
          setIsUnlocked(true); // Simulate unlock after email submission
          toast.success("Report unlocked! You will also receive a copy via email.");
        }}
      />
    </main>
  );
}
