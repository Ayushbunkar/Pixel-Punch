"use client";

import { useState } from "react";
import Image from "next/image";
import { CostScanWizard } from "@/modules/cost-audit/questions/CostScanWizard";
import { OpportunityWizard } from "@/modules/opportunity-audit/questions/OpportunityWizard";
import { Footer } from "@/shared/components/Footer";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export default function HomePage() {
  const [activeWizard, setActiveWizard] = useState<"cost" | "opportunity" | null>(null);

  const handleStartCostScan = () => setActiveWizard("cost");
  const handleStartOpportunityScan = () => setActiveWizard("opportunity");

  if (activeWizard === "cost") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#0a0a0f] to-[#1a1a2e] text-white py-12">
        <div className="w-full max-w-4xl px-4">
          <CostScanWizard />
        </div>
        <Footer />
      </main>
    );
  }

  if (activeWizard === "opportunity") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#0a0a0f] to-[#1a1a2e] text-white py-12">
        <div className="w-full max-w-4xl px-4">
          <OpportunityWizard />
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between bg-gradient-to-b from-[#0a0a0f] to-[#1a1a2e] text-white">
      {/* Header/Welcome Section */}
      <div className="relative flex flex-col items-center justify-center w-full py-12 px-4 text-center">
        <div className="absolute top-4 right-4 flex items-center space-x-2">
          <span className="text-sm text-gray-400">By</span>
          <Image src="/Pixelpunch_logo2.png" alt="Pixel Punch AI Logo" width={96} height={24} priority />
        </div>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-purple-600 text-white px-6 py-2 rounded-full mb-4 text-sm font-semibold shadow-lg"
        >
          Free - 3 minute diagnostic
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-5xl font-bold max-w-4xl leading-tight mb-6"
        >
          See where your AI spend is leaking in 3 minutes
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg text-gray-300 max-w-2xl mb-8"
        >
          Pixel Punch AI helps you identify hidden costs, optimize your AI infrastructure, and unlock new opportunities for efficiency and growth.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 mb-12"
        >
          <button
            onClick={handleStartCostScan}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            Start Cost Scan <ArrowRight className="w-5 h-5" />
          </button>
          <button
            onClick={handleStartOpportunityScan}
            className="px-8 py-3 bg-green-600 text-white rounded-lg text-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
          >
            Start Opportunity Scan <ArrowRight className="w-5 h-5" />
          </button>
        </motion.div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl w-full px-4 py-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-col items-center p-6 bg-gradient-to-br from-[#1a1a2e] to-[#2a2a3e] border border-gray-700 rounded-xl shadow-lg"
          >
            <h3 className="text-xl font-semibold mb-2 text-purple-300">RAG Scorecard</h3>
            <p className="text-gray-300 text-center">
              Get a detailed RAG (Red, Amber, Green) scorecard for your AI spend.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="flex flex-col items-center p-6 bg-gradient-to-br from-[#1a1a2e] to-[#2a2a3e] border border-gray-700 rounded-xl shadow-lg"
          >
            <h3 className="text-xl font-semibold mb-2 text-purple-300">Tailored Insights</h3>
            <p className="text-gray-300 text-center">
              Receive actionable insights customized to your business needs.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="flex flex-col items-center p-6 bg-gradient-to-br from-[#1a1a2e] to-[#2a2a3e] border border-gray-700 rounded-xl shadow-lg"
          >
            <h3 className="text-xl font-semibold mb-2 text-purple-300">Next-Step Recommendation</h3>
            <p className="text-gray-300 text-center">
              Clear recommendations on how to optimize and grow.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Built For Section */}
      <div className="w-full py-12 px-4 bg-[#1a1a2e] text-center">
        <h2 className="text-2xl font-bold text-gray-200 mb-8">BUILT FOR AI-NATIVE TEAMS AT</h2>
        <div className="flex flex-wrap justify-center items-center gap-8">
          {/* Replace with actual company logos */}
          <Image src="/Pixelpunch_logo2.png" alt="Company Logo 1" width={120} height={30} />
          <Image src="/Pixelpunch_logo2.png" alt="Company Logo 2" width={120} height={30} />
          <Image src="/Pixelpunch_logo2.png" alt="Company Logo 3" width={120} height={30} />
          <Image src="/Pixelpunch_logo2.png" alt="Company Logo 4" width={120} height={30} />
        </div>
      </div>

      <Footer />
    </main>
  );
}