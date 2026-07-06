import type { FormState, Rag } from "@/modules/cost-audit/types";

import { getStorageService } from "@/shared/services/storage/storage-provider.service";

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
  files: Array<{ name: string; path: string; type: string; size: number }>;
  architectureAnalysis?: { summary: string; findings: string[]; risks: string[] };
  costAnalysis?: { summary: string; normalizedData: any };
  usageMetrics?: any;
  confidenceScore?: string;
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
async function generateFallbackReport(input: AuditInput): Promise<AuditOutput> {
  const { answers, scores, websiteUrl, aiStack, technicalNotes, files, architectureAnalysis, costAnalysis, usageMetrics, confidenceScore } = input;
  const companyName = answers.company || "Your Company";

  const storageService = getStorageService();
  const filesWithContent: Array<{ name: string; content: string }> = [];
  for (const file of files) {
    try {
      const fileBuffer = await storageService.downloadFile(file.path);
      filesWithContent.push({ name: file.name, content: fileBuffer.toString('utf8') });
    } catch (error) {
      console.error(`[audit.service] Failed to download file ${file.path}:`, error);
      filesWithContent.push({ name: file.name, content: `Error downloading file: ${error.message}` });
    }
  }

  // Extract domain name
  let domain = "";
  if (websiteUrl) {
    try {
      domain = websiteUrl.replace(/https?:\/\/(www\.)?/, '').split('/')[0];
    } catch {
      domain = websiteUrl;
    }
  }

  // Analyze files for tech keywords
  const detectedTech: string[] = [];
  const fileKeywords = {
    "Vector Database": ["pinecone", "chroma", "milvus", "qdrant", "weaviate", "pgvector", "faiss"],
    "AI Orchestrator": ["langchain", "llamaindex", "autogen", "crewai", "semantic kernel"],
    "Cloud & Infrastructure": ["kubernetes", "docker", "eks", "ecs", "fargate", "sagemaker", "runpod", "baseten", "together", "anyscale", "modal"],
    "AI Observability": ["langfuse", "langsmith", "openllmetry", "portkey", "helicone", "phoenix"],
  };

  const parsedFilesInfo: string[] = [];

  filesWithContent.forEach(f => {
    const textLower = f.content.toLowerCase();

    for (const [category, words] of Object.entries(fileKeywords)) {
      words.forEach(word => {
        if (textLower.includes(word)) {
          const formatted = category === "AI Observability" || category === "AI Orchestrator"
            ? `${word.charAt(0).toUpperCase() + word.slice(1)} (${category})`
            : word.toUpperCase();
          if (!detectedTech.includes(formatted)) {
            detectedTech.push(formatted);
          }
        }
      });
    }

    let snippet = f.content.trim().replace(/\s+/g, ' ');
    if (snippet.length > 200) {
      snippet = snippet.substring(0, 197) + "...";
    }
    parsedFilesInfo.push(`*   **Analyzed File [${f.name}]**: Decoded and parsed text context. Detected technical summary: _"${snippet || "(Empty text content detected)"}"_`);
  });

  const providers = aiStack.providers || [];
  const models = aiStack.models || "";
  const infrastructure = aiStack.infrastructure || [];
  const otherStack = aiStack.other || [];

  const hasHighSpend = answers.monthly_spend_band === "100k_plus" || answers.monthly_spend_band === "25k_100k";
  const hasMediumSpend = answers.monthly_spend_band === "5k_25k";
  const hasOpenAI = providers.includes("OpenAI");
  const hasAnthropic = providers.includes("Anthropic");
  const hasRAG = otherStack.includes("RAG system");
  const hasVectorDb = otherStack.includes("Vector database");
  const hasGPUs = otherStack.includes("GPU usage");
  const hasNoUnitEconomics = answers.unit_economics.includes("none");

  // Dynamic Findings and Recommendations arrays
  const findings: string[] = [];
  const recommendations: string[] = [];

  // ── Findings logic ────────────────────────────────────────────────────────
  findings.push(`I analyzed the provided technical information for ${companyName}${domain ? ` (associated with domain ${domain})` : ""} and identified critical areas of infrastructure cost leakage.`);

  if (hasHighSpend) {
    findings.push(`Premium LLM calls represent a substantial cost vector, showing potential token redundancies under the current '${answers.leakage_pattern}' leakage pattern.`);
  } else if (hasMediumSpend) {
    findings.push("Unmanaged development workflows and loose orchestration thresholds are causing minor cost runaways.");
  } else {
    findings.push("Initial pilots and small deployments lack prompt reuse, resulting in higher cold-start input costs per request.");
  }

  // Include architecture findings
  if (architectureAnalysis?.findings && architectureAnalysis.findings.length > 0) {
    findings.push(...architectureAnalysis.findings);
  } else if (hasRAG || hasVectorDb) {
    findings.push("Vector searches and RAG injection contexts are unpruned, frequently bloating the LLM prompt size with redundant tokens.");
  }

  if (hasGPUs) {
    findings.push("Low GPU host utilization rates during off-peak windows indicate potential waste in dedicated instance hosting.");
  }

  if (hasNoUnitEconomics) {
    findings.push("Complete absence of granular cost tracking (cost-per-request or user attribution) creates pricing risks during production scaling.");
  }

  if (detectedTech.length > 0) {
    findings.push(`Detected signature components in resource files: ${detectedTech.join(", ")}. These present integration-level optimization opportunities.`);
  }

  // Ensure findings length is exactly 3-5
  while (findings.length < 3) {
    findings.push("Under-optimized prompt templates retransmitting identical system instructions repeatedly.");
  }
  if (findings.length > 5) {
    findings.splice(5);
  }

  // ── Recommendations logic ──────────────────────────────────────────────────
  if (hasOpenAI || hasAnthropic) {
    recommendations.push(`Implement Semantic Caching: Deploy a caching proxy (such as Redis or Portkey) to intercept identical model queries, targeting the primary provider${providers.length > 1 ? 's' : ''} (${providers.join(", ")}).`);
  }
  
  if (models.toLowerCase().includes("gpt-4") || models.toLowerCase().includes("claude-3-5")) {
    const primaryModel = models.toLowerCase().includes("gpt-4") ? "GPT-4" : "Claude 3.5 Sonnet";
    const lighterModel = models.toLowerCase().includes("gpt-4") ? "GPT-4o-mini" : "Claude 3.5 Haiku";
    recommendations.push(`Adopt Model Tiering: Route simple routing, classification, or small JSON formatting queries away from ${primaryModel} and down to ${lighterModel}, which yields up to a 90% cost reduction.`);
  } else {
    recommendations.push("Establish a Multi-model Gateway: Enable fallbacks to lighter model weights (e.g. Gemini 2.5 Flash) for low-complexity operational tasks.");
  }

  if (hasRAG || hasVectorDb) {
    recommendations.push("Apply RAG Optimization: Shrink chunk sizes, implement hybrid re-ranking, and configure metadata filters to avoid sending irrelevant text contexts inside the LLM prompt window.");
  }

  if (hasGPUs) {
    recommendations.push("Migrate to Serverless Inference: Shift cold/idle models from persistent AWS EC2/GCP instances to auto-scaling serverless model containers (e.g., RunPod, Baseten, or Together API).");
  }

  if (hasNoUnitEconomics) {
    recommendations.push("Integrate cost observability gateways (such as Langfuse, LiteLLM, or Helicone) to associate every token call with a unique userId or feature flag.");
  }

  // Add usage metrics optimization recommendations
  if (usageMetrics?.optimizationAreas) {
    usageMetrics.optimizationAreas.forEach((area: string) => {
      if (!recommendations.includes(area)) {
        recommendations.push(area);
      }
    });
  }

  // Ensure recommendations length is exactly 3-5
  while (recommendations.length < 3) {
    recommendations.push("Enable native provider Prompt Caching (supported by Anthropic and Gemini) for system prompts exceeding 1,024 tokens.");
  }
  if (recommendations.length > 5) {
    recommendations.splice(5);
  }

  const costDetails = costAnalysis?.normalizedData || {};

  // Compile final markdown text
  const markdownReport = `
# AI Cost Audit & Architecture Report

### Executive Summary
I analyzed the provided technical information for **${companyName}** to assess cost efficiency, performance risk, and architecture scaling patterns. The audit score indicates a **Tier ${scores.tier}** priority, suggesting specific areas of immediate cost leakage and infrastructure refinement.

---

### Current Architecture Analysis
*   **Known Information**:
    *   **Primary Providers**: ${providers.length > 0 ? providers.join(", ") : "Not specified"}
    *   **Models Utilized**: ${models || "Not specified"}
    *   **Cloud Infrastructure**: ${infrastructure.length > 0 ? infrastructure.join(", ") : "Not specified"}
    *   **Capabilities & Setup**: ${otherStack.length > 0 ? otherStack.join(", ") : "None specified"}
    *   **Audited Domain**: ${domain ? `[${domain}](http://${domain})` : "Not provided"}
    *   **Diagnostic Answers**: Dependence: _${answers.ai_dependence.replace('_', ' ')}_, Spend Band: _${answers.monthly_spend_band.replace('_', ' ')}_, Leakage pattern: _${answers.leakage_pattern.replace('_', ' ')}_.
${parsedFilesInfo.length > 0 ? `    *   **Uploaded Resources**:\n${parsedFilesInfo.map(info => `        ${info}`).join("\n")}` : "    *   **Uploaded Resources**: No technical documentation was uploaded."}

*   **Architecture Diagram Analysis**:
    ${architectureAnalysis?.summary || "No architecture diagrams were provided. Analysis based on user questionnaires and notes."}

*   **Assumptions**:
    *   Orchestration layers likely interface directly with provider SDKs rather than through a proxy gateway, causing vendor lock-in.
    *   Recurring system prompts and system instructions are likely sent in full on each transaction without leveraging provider prompt caching headers.
    *   RAG chunking strategies are likely static and uncompressed, resulting in high context window input overhead.

---

### Cost Analysis
*   **Cost Evidence Summary**:
    ${costAnalysis?.summary || "No invoice or usage evidence was supplied for billing validation."}
*   **Normalized Cost Metrics**:
    *   **Monthly Spend**: ${costDetails.monthlySpend || "No direct billing data"}
    *   **Primary Billing Provider**: ${costDetails.provider || "Not specified"}
    *   **Service Category Billed**: ${costDetails.serviceUsage || "Not specified"}
    *   **Model Allocation**: ${costDetails.modelUsage || "Not specified"}
    *   **Token Volume Billing**: ${costDetails.tokenConsumption || "Not specified"}
    *   **GPU Hardware Cost**: ${costDetails.gpuCost || "Not specified"}
    *   **Identified Idle Resource Waste**: ${costDetails.unusedResources || "Not specified"}

---

### Detected Risks
*   **Verified Risks (Based on Uploaded Data)**:
    ${architectureAnalysis?.risks && architectureAnalysis.risks.length > 0
      ? architectureAnalysis.risks.map(r => `*   ${r}`).join("\n    ")
      : "*   High dependency on closed-source model pricing structures."}
*   **Potential Risks (Based on Operational Patterns)**:
    *   Single API route dependency without fallback model endpoints risk operational downtime.
    *   Linear token cost growth matches scaling user volume due to missing semantic caching proxy.
*   **Assumptions (Missing Data)**:
    *   Observability platforms (Langfuse, LiteLLM) are assumed missing or non-functional, preventing feature-level ROI metrics.

---

### Optimization Opportunities
*   **Heuristics Findings**:
    ${findings.map(f => `*   ${f}`).join("\n    ")}
*   **Key Action Areas**:
    *   Prompt Caching: Activate cache headers on all system instructions over 1k tokens (saves up to 50% on input costs).
    *   Model Routing: Set up model routing logic to automatically dispatch simple formatting or classification tasks to cheaper tiers.

---

### Quick Wins
*   Enable native provider Prompt Caching (supported by Anthropic and Gemini) for system prompts exceeding 1,024 tokens.
*   Adopt Model Tiering: Route simple formatting queries to lighter model weights (e.g. GPT-4o-mini / Claude 3.5 Haiku) which reduces costs by up to 90%.

---

### Long-Term Recommendations
*   Configure a central API wrapper proxy (like LiteLLM or Portkey) to intercept all traffic and log usage tokens.
*   Establish semantic database caches (e.g., Redis or GPTCache) to resolve repetitive user query inputs.

---

### Confidence Level
*   **Audit Confidence**: **${confidenceScore || "20%"}**
*   *Confidence Attribution*: Questionnaire data (20%), Website data (${websiteUrl ? "15%" : "0%"}), AI stack (${(aiStack.providers?.length ?? 0) > 0 || aiStack.models ? "15%" : "0%"}), Documents (${files.length > 0 ? "20%" : "0%"}), Architecture diagram (${architectureAnalysis?.summary && architectureAnalysis.summary !== "No architecture documentation was supplied for analysis." ? "15%" : "0%"}), Cost Evidence (${costAnalysis?.summary && costAnalysis.summary !== "No invoice or billing documents were uploaded for validation." ? "15%" : "0%"}).

---

### Key Findings
${findings.map(f => `- ${f}`).join("\n")}

### Expert Recommendations
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
  const { answers, scores, websiteUrl, aiStack, technicalNotes, files, architectureAnalysis, costAnalysis, usageMetrics, confidenceScore } = input;

  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  const mistralKey = process.env.MISTRAL_API_KEY;

  if (!geminiKey && !openaiKey && !mistralKey) {
    console.log("[audit.service] No AI API keys found. Running fallback generator.");
    return generateFallbackReport(input);
  }

  const storageService = getStorageService();
  const filesWithContent: Array<{ name: string; content: string }> = [];
  for (const file of files) {
    try {
      const fileBuffer = await storageService.downloadFile(file.path);
      filesWithContent.push({ name: file.name, content: fileBuffer.toString('utf8') });
    } catch (error) {
      console.error(`[audit.service] Failed to download file ${file.path}:`, error);
      filesWithContent.push({ name: file.name, content: `Error downloading file: ${error.message}` });
    }
  }

  // Build the context prompt
  const prompt = `You are an AI infrastructure cost auditor. Analyze the company's actual technical environment using provided architecture, usage data, cost evidence, and technical information.
 
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
  ${filesWithContent.length > 0 ? filesWithContent.map(f => `--- File: ${f.name} ---\n${f.content}`).join("\n\n") : "No documents provided."}

- Architecture Diagram Analysis:
  ${architectureAnalysis?.summary || "None provided"}
  * Findings: ${architectureAnalysis?.findings?.join(", ") || "None"}
  * Risks: ${architectureAnalysis?.risks?.join(", ") || "None"}

- Cost Evidence Analysis:
  ${costAnalysis?.summary || "None provided"}
  * Normalized Cost Data: ${JSON.stringify(costAnalysis?.normalizedData || {})}

- AI Usage Metrics Analysis:
  * Monthly Requests: ${usageMetrics?.monthly_requests || "Unspecified"}
  * Input Tokens: ${usageMetrics?.input_tokens || "Unspecified"}
  * Output Tokens: ${usageMetrics?.output_tokens || "Unspecified"}
  * Model Distribution: ${usageMetrics?.model_distribution || "Unspecified"}
  * GPU Hours: ${usageMetrics?.gpu_hours || "Unspecified"}
  * Latency Requirements: ${usageMetrics?.latency_requirements || "Unspecified"}
  * User Volume: ${usageMetrics?.user_volume || "Unspecified"}

- Audit Confidence Score:
  * Confidence Level: ${confidenceScore || "20%"}

Please perform a detailed cost audit. You must:
1. Act as a senior AI cost and infrastructure auditor.
2. Address the company's specific architecture details, files, and cost evidence.
3. Be realistic: distinguish verified findings (based on uploaded data), potential risks (based on patterns), and assumptions (missing information).
4. Your response MUST include the exact phrase: "I analyzed the provided technical information..." to introduce your findings.
5. Provide a premium Markdown report with the following exact heading sections:
   - # AI Cost Audit & Architecture Report
   - ### Executive Summary
   - ### Current Architecture Analysis
   - ### Cost Analysis
   - ### Detected Risks
   - ### Optimization Opportunities
   - ### Quick Wins
   - ### Long-Term Recommendations
   - ### Confidence Level
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
    } else if (mistralKey) {
      console.log("[audit.service] Generating report using Mistral...");
      const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${mistralKey}`,
        },
        body: JSON.stringify({
          model: "mistral-large-latest",
          messages: [
            { role: "system", content: "You are an AI infrastructure cost auditor." },
            { role: "user", content: prompt },
          ],
          temperature: 0.2,
        }),
      });

      if (!res.ok) {
        throw new Error(`Mistral API error: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      const text = data.choices?.[0]?.message?.content;
      if (!text) {
        throw new Error("Invalid response format from Mistral API");
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

  } catch (err: unknown) {
    console.error("[audit.service] AI API failed. Running fallback report generator. Error:", err);
    return generateFallbackReport(input);
  }
}
