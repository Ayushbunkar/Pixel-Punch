import type { FormState, Rag } from "@/features/cost-scan/types";

interface AuditInput {
  answers: FormState;
  scores: {
    spend: Rag;
    architecture: Rag;
    pain: Rag;
    tier: number;
  };
  websiteUrl?: string;
  aiStack: {
    providers?: string[];
    models?: string;
    infrastructure?: string[];
    other?: string[];
  };
  technicalNotes?: string;
  files: Array<{ name: string; content: string }>;
}

interface AuditOutput {
  auditReport: string;
  findings: string[];
  recommendations: string[];
}

/**
 * Extracts bullet points under a specific heading from markdown text.
 */
function extractBulletPoints(text: string, heading: string): string[] {
  const lines = text.split("\n");
  const result: string[] = [];
  let inSection = false;

  for (const line of lines) {
    if (line.toLowerCase().includes(heading.toLowerCase())) {
      inSection = true;
      continue;
    }
    if (inSection) {
      if (line.trim().startsWith("#")) {
        break; // Hit next heading section
      }
      const trimmed = line.trim();
      if (trimmed.startsWith("-") || trimmed.startsWith("*")) {
        const content = trimmed.replace(/^[-*]\s*/, "").trim();
        if (content) {
          result.push(content);
        }
      }
    }
  }

  // Fallback default list if parser extracts nothing
  return result;
}

/**
 * Fallback local report generator when no LLM API key is configured or API fails.
 */
function generateFallbackReport(input: AuditInput): AuditOutput {
  const { answers, scores, websiteUrl, aiStack, technicalNotes, files } = input;
  const companyName = answers.company || "Your Company";

  // Build some custom sections based on answers
  const hasHighSpend = answers.monthly_spend_band === "100k_plus" || answers.monthly_spend_band === "25k_100k";
  const hasOpenAI = aiStack.providers?.includes("OpenAI");
  const hasGPUs = aiStack.other?.includes("GPU usage");
  const hasNoUnitEconomics = answers.unit_economics.includes("none");

  const findings: string[] = [
    `I analyzed the provided technical information for ${companyName} and identified several optimization vectors.`,
  ];
  const recommendations: string[] = [];

  // Tailor findings
  if (hasHighSpend) {
    findings.push("Unoptimized premium model calls representing significant waste in non-critical pathways.");
    recommendations.push("Implement Model Tiering: route simple categorization and retrieval jobs to lighter models (e.g. Gemini 2.5 Flash / GPT-4o-mini).");
  } else {
    findings.push("Opportunities to leverage prompt caching to reduce input token billing on recurring system prompts.");
    recommendations.push("Review caching capabilities for your primary providers to optimize repetitive prompts.");
  }

  if (hasOpenAI) {
    findings.push("Heavy reliance on closed commercial APIs without semantic caching or middleware controls.");
    recommendations.push("Deploy a semantic caching layer (e.g., Redis or GPTCache) to intercept identical prompt vectors.");
  }

  if (hasGPUs) {
    findings.push("Idle GPU cluster capacity during off-peak hours leading to unrecovered infrastructure spend.");
    recommendations.push("Right-size GPU allocations and deploy auto-scaling rules to shut down inactive nodes.");
  }

  if (hasNoUnitEconomics) {
    findings.push("Lack of granular cost-per-request tracking obscures feature-level ROI.");
    recommendations.push("Integrate an AI observability proxy (e.g., LiteLLM, Langfuse, or Portkey) to enable cost-per-user attribution.");
  }

  if (files.length > 0) {
    findings.push(`Analyzed technical documentation (${files.map(f => f.name).join(", ")}) indicating custom orchestration patterns.`);
    recommendations.push("Audit custom orchestration pipelines to ensure RAG retrieval sizes do not bloat context windows.");
  }

  // Ensure default bullets exist
  if (findings.length === 1) {
    findings.push("Potential model leakage due to fallback to premium models on network timeouts.");
  }
  if (recommendations.length === 0) {
    recommendations.push("Implement cost-limit alerts and auto-throttle thresholds in your staging/production environments.");
  }

  const markdownReport = `
# AI Cost Audit & Architecture Report

### Executive Summary
I analyzed the provided technical information for **${companyName}** to assess cost efficiency, performance risk, and architecture scaling patterns. The audit score indicates a **Tier ${scores.tier}** priority, suggesting specific areas of immediate cost leakage and infrastructure refinement.

---

### 1. Current AI Architecture Understanding
*   **Known Information**: 
    *   Primary AI stack includes: ${aiStack.providers?.join(", ") || "unspecified providers"}
    *   Models utilized: ${aiStack.models || "unspecified models"}
    *   Deployment infrastructure: ${aiStack.infrastructure?.join(", ") || "unspecified cloud environment"}
    *   AI capabilities: ${aiStack.other?.join(", ") || "none specified"}
    *   Website under audit: ${websiteUrl || "not supplied"}
*   **Assumptions**:
    *   The orchestration utilizes standard SDK wrappers without wrapper gateways, which may limit routing flexibility.
    *   Repetitive agent prompts or RAG context vectors are re-transmitted without caching, driving up token fees.

---

### 2. Possible Cost Leakage
*   **Expensive Model Usage**: Running high-tier models on simple tasks (classification, token routing, small formatting checks).
*   **Unnecessary Token Usage**: Redundant system instructions and over-bloated retrieval contexts in the RAG pipeline.
*   **Missing Caching**: Lack of prompt caching or semantic database interceptors, resulting in charging for identical inputs.
*   **Inefficient Infrastructure**: No auto-scaling configured on dedicated model instances or GPU compute hosts.

---

### 3. Optimization Opportunities & Quick Wins
*   **Prompt Caching**: Enable caching for prompt templates (saves up to 50% on input tokens).
*   **Semantic Gateway**: Put a routing proxy in place to handle load-balancing and tiering.
*   **Open-Source Embeddings**: Move embedding workloads from paid APIs to local or open-source hosting to reduce micro-costs.

---

### 4. Technical Risks & Long-term Recommendations
*   **Operational Lock-in**: Hardcoded integrations to single API providers present API downtime risk and pricing volatility risk.
*   **Trace Observability**: Without unit economics tracking, scaling user adoption will create linear cost growth.
*   *Recommendation*: Set up Langfuse/OpenLLMetry tracing to map cost-per-user metrics.

---

### 5. Summary Insights

#### Key Findings
${findings.map(f => `- ${f}`).join("\n")}

#### Expert Recommendations
${recommendations.map(r => `- ${r}`).join("\n")}
`;

  return {
    auditReport: markdownReport.trim(),
    findings,
    recommendations,
  };
}

/**
 * Main generator service. Calls Gemini or OpenAI API if configured,
 * otherwise falls back to the deterministic local generator.
 */
export async function generateAuditReport(input: AuditInput): Promise<AuditOutput> {
  const { answers, scores, websiteUrl, aiStack, technicalNotes, files } = input;

  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (!geminiKey && !openaiKey) {
    console.log("[audit.service] No AI API keys found. Running fallback generator.");
    return generateFallbackReport(input);
  }

  // Build the context prompt
  const prompt = `You are an AI infrastructure cost auditor analyzing a company's actual AI environment.

Here is the context provided about the company:
- Company name: ${answers.company || "unspecified"} (Scan submitted by: ${answers.firstname} ${answers.lastname}, Role: ${answers.job_title})
- Contact email: ${answers.email}
- Website URL: ${websiteUrl || "Not provided"}

- Questionnaire Scan Answers:
  * AI Dependence level: ${answers.ai_dependence}
  * Monthly Spend Band: ${answers.monthly_spend_band}
  * Spend Visibility rating: ${answers.spend_visibility}
  * Unit Economics tracked: ${answers.unit_economics.join(", ") || "none"}
  * Primary Cost Pain point: ${answers.main_pain}
  * Primary Cost Leakage pattern: ${answers.leakage_pattern}
  * Optimization steps completed: ${answers.optimization_done.join(", ") || "none"}
  * Savings target threshold: ${answers.savings_threshold}
  * Diagnostic Scorecard RAG: Spend: ${scores.spend}, Architecture: ${scores.architecture}, Pain: ${scores.pain}
  * Calculated Priority Tier: Tier ${scores.tier}

- AI Stack Information:
  * Providers: ${aiStack.providers?.join(", ") || "Not specified"}
  * Models: ${aiStack.models || "Not specified"}
  * Infrastructure: ${aiStack.infrastructure?.join(", ") || "Not specified"}
  * Additional Capabilities: ${aiStack.other?.join(", ") || "none"}

- Additional Technical Notes/Context:
  ${technicalNotes || "None provided"}

- Extracted Technical Resources & Document Texts:
  ${files.length > 0 ? files.map(f => `--- File: ${f.name} ---\n${f.content}`).join("\n\n") : "No documents provided."}

Please perform a detailed cost audit. You must:
1. Act as a senior AI cost and infrastructure auditor.
2. Address the company's specific architecture details and files.
3. Be realistic: separate known information (from their inputs) from assumptions (what you guess) and recommendations.
4. Your response MUST include the exact phrase: "I analyzed the provided technical information..." to introduce your findings.
5. Provide a premium Markdown report with the following exact heading sections:
   - # AI Cost Audit & Architecture Report
   - ### 1. Current AI Architecture Understanding
   - ### 2. Possible Cost Leakage
   - ### 3. Optimization Opportunities & Quick Wins
   - ### 4. Technical Risks & Long-term Recommendations
   - ### Key Findings (List exactly 3-5 bullet points starting with "-" here)
   - ### Expert Recommendations (List exactly 3-5 bullet points starting with "-" here)
`;

  try {
    let reportText = "";

    if (geminiKey) {
      console.log("[audit.service] Generating report using Gemini...");
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
          },
        }),
      });

      if (!res.ok) {
        throw new Error(`Gemini API error: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new Error("Invalid response format from Gemini API");
      }
      reportText = text;
    } else if (openaiKey) {
      console.log("[audit.service] Generating report using OpenAI...");
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: "You are an AI infrastructure cost auditor." },
            { role: "user", content: prompt },
          ],
          temperature: 0.2,
        }),
      });

      if (!res.ok) {
        throw new Error(`OpenAI API error: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      const text = data.choices?.[0]?.message?.content;
      if (!text) {
        throw new Error("Invalid response format from OpenAI API");
      }
      reportText = text;
    }

    // Parse out findings and recommendations from the generated text
    const findings = extractBulletPoints(reportText, "Key Findings");
    const recommendations = extractBulletPoints(reportText, "Expert Recommendations");

    return {
      auditReport: reportText,
      findings: findings.length > 0 ? findings : ["Identified opportunities to transition categorization prompts to lighter model tiers."],
      recommendations: recommendations.length > 0 ? recommendations : ["Implement prompt caching to reduce repetitious input token costs."],
    };

  } catch (err) {
    console.error("[audit.service] AI API failed. Running fallback report generator. Error:", err);
    return generateFallbackReport(input);
  }
}
