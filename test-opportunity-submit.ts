import { randomUUID } from "crypto";
import { runScoringEngine } from "./modules/opportunity-audit/scoring/opportunity-score-engine";
import { qualifyLead } from "./modules/opportunity-audit/scoring/opportunity-lead-qualifier";
import { generateAIRecommendations } from "./modules/opportunity-audit/scoring/opportunity-recommendation-engine";
import { generateOpportunityReport } from "./modules/opportunity-audit/scoring/opportunity-report-generator";

// Dummy deduplicateRecommendations from route.ts
function deduplicateRecommendations(recommendations: string[]): string[] {
  const seen = new Set<string>();
  return (recommendations || []).filter((rec) => {
    if (!rec) return false;
    const normalized = String(rec).toLowerCase().trim();
    if (seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
}

const input = {
  business_type: "b2b_saas",
  main_outcome: "lower_manual_work",
  biggest_challenge: "too_much_manual",
  data_systems: ["crm"],
  automation_barriers: "data_not_centralized",
  workflow_standardization: "mostly_adhoc",
  manual_processes: ["data_entry"],
  info_retrieval: "ask_colleague",
  systems_connection: "mostly_disconnected",
  data_quality: "some_gaps",
  inquiry_handling: "humans_mostly",
  request_types: "complex_troubleshooting",
  lead_qualification: "humans_research",
  desired_use_case: "automating_tasks",
  adoption_blocker: "budget_concerns",
  firstname: "John",
  lastname: "Doe",
  email: "john@example.com",
  company: "Acme",
  company_size: "11_50",
  job_title: "CEO",
  extra_context: "",
  ref: "test"
};

async function testSubmit() {
  const submissionId = randomUUID();
  console.log("Starting test...");

  try {
    const results = runScoringEngine(input as any, submissionId);
    console.log("Generated report, getting AI recommendations...");

    const aiRecommendations = await generateAIRecommendations(input as any, results.categories);
    console.log("Got AI recommendations, generating opportunity report...");
    
    const reportResult = await generateOpportunityReport(input as any, results.categories, aiRecommendations);
    console.log("Report generated. Qualifying lead...");

    const leadResult = qualifyLead(input as any, submissionId);
    console.log("Lead Qualified.");

    const dbPayload = {
      submissionId,
      createdDate: results.createdDate,
      auditStatus: results.auditStatus,
      company: {
        name: input.company,
        industry: input.business_type,
        size: input.company_size,
        businessType: input.business_type,
      },
      contact: {
        firstname: input.firstname,
        lastname: input.lastname,
        email: input.email,
        job_title: input.job_title,
      },
      questions: {},
      answers: {},
      score: {
        readiness: results.scorecard.readiness,
        value: results.scorecard.value,
        opportunity: results.scorecard.opportunity,
        tier: results.tier,
        categories: results.categories,
      },
      scorecard: {
        readiness: results.scorecard.readiness,
        value: results.scorecard.value,
        opportunity: results.scorecard.opportunity,
      },
      tier: results.tier,
      insights: [],
      ctaUrl: "",
      confidenceScore: "",
      architectureAnalysis: { summary: "", findings: [], risks: [] },
      costAnalysis: { summary: "", normalizedData: {} },
      recommendations: deduplicateRecommendations(aiRecommendations.map(r => r.opportunity)),
      roadmap: results.roadmap,
      auditReport: reportResult.reportText,
      findings: deduplicateRecommendations(reportResult.findings || []),
      nextSteps: deduplicateRecommendations(reportResult.nextSteps || []),
      leadQualification: leadResult,
    };

    console.log("Payload created successfully.");

  } catch (error) {
    console.error("TEST FAILED WITH ERROR:", error);
  }
}

testSubmit();
