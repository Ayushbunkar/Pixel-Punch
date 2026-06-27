# AI cost Audit vs. AI Opportunity Audit — Folder Comparison Map

This document maps out the parallel file structure between the two modules to make it easy to find, compare, and modify files.

---

## 1. Parallel File Mapping

| Component / Layer | AI Cost Audit | AI Opportunity Audit |
| :--- | :--- | :--- |
| **JSON Validation Schema** | [cost-scan-schema.json](file:///d:/Yash%20Coding2/new/PixelPunch/modules/cost-audit/schema/cost-scan-schema.json) | [opportunity-schema.json](file:///d:/Yash%20Coding2/new/PixelPunch/modules/opportunity-audit/schema/opportunity-schema.json) |
| **TypeScript Types** | [types/index.ts](file:///d:/Yash%20Coding2/new/PixelPunch/modules/cost-audit/types/index.ts) | [types/index.ts](file:///d:/Yash%20Coding2/new/PixelPunch/modules/opportunity-audit/types/index.ts) |
| **Server-Side Validation** | [server-validation.ts](file:///d:/Yash%20Coding2/new/PixelPunch/modules/cost-audit/utils/server-validation.ts) | [server-validation.ts](file:///d:/Yash%20Coding2/new/PixelPunch/modules/opportunity-audit/utils/server-validation.ts) |
| **Scoring Rules Config** | *Hardcoded in scoring engines* | [opportunity-scoring-config.json](file:///d:/Yash%20Coding2/new/PixelPunch/modules/opportunity-audit/scoring/opportunity-scoring-config.json) |
| **Core Scoring Engine** | [cost-score-engine.ts](file:///d:/Yash%20Coding2/new/PixelPunch/modules/cost-audit/scoring/cost-score-engine.ts) | [opportunity-score-engine.ts](file:///d:/Yash%20Coding2/new/PixelPunch/modules/opportunity-audit/scoring/opportunity-score-engine.ts) |
| **Sales Lead Qualifier** | [cost-score-service.ts](file:///d:/Yash%20Coding2/new/PixelPunch/modules/cost-audit/scoring/cost-score-service.ts) | [opportunity-lead-qualifier.ts](file:///d:/Yash%20Coding2/new/PixelPunch/modules/opportunity-audit/scoring/opportunity-lead-qualifier.ts) |
| **AI Recommendation Logic**| *Included in report RAG* | [opportunity-recommendation-engine.ts](file:///d:/Yash%20Coding2/new/PixelPunch/modules/opportunity-audit/scoring/opportunity-recommendation-engine.ts) |
| **AI Report Generator** | [audit.service.ts](file:///d:/Yash%20Coding2/new/PixelPunch/shared/utils/audit.service.ts) *(shared)* | [opportunity-report-generator.ts](file:///d:/Yash%20Coding2/new/PixelPunch/modules/opportunity-audit/scoring/opportunity-report-generator.ts) |
| **Scoring Engine Tests** | [step4.test.ts](file:///d:/Yash%20Coding2/new/PixelPunch/modules/cost-audit/scoring/step4.test.ts) | [opportunity-score-engine.test.ts](file:///d:/Yash%20Coding2/new/PixelPunch/modules/opportunity-audit/scoring/opportunity-score-engine.test.ts) |
| **Lead Qualifier Tests** | *Embedded in scoring tests* | [opportunity-lead-qualifier.test.ts](file:///d:/Yash%20Coding2/new/PixelPunch/modules/opportunity-audit/scoring/opportunity-lead-qualifier.test.ts) |
| **Wizard Form State Hook**| [useCostForm.ts](file:///d:/Yash%20Coding2/new/PixelPunch/modules/cost-audit/questions/hooks/useCostForm.ts) | [useOpportunityForm.ts](file:///d:/Yash%20Coding2/new/PixelPunch/modules/opportunity-audit/questions/hooks/useOpportunityForm.ts) |
| **Wizard Submit Hook** | [useSubmitCost.ts](file:///d:/Yash%20Coding2/new/PixelPunch/modules/cost-audit/questions/hooks/useSubmitCost.ts) | [useSubmitOpportunity.ts](file:///d:/Yash%20Coding2/new/PixelPunch/modules/opportunity-audit/questions/hooks/useSubmitOpportunity.ts) |
| **Wizard Layout Wrapper** | [CostScanWizard.tsx](file:///d:/Yash%20Coding2/new/PixelPunch/modules/cost-audit/questions/CostScanWizard.tsx) | [OpportunityWizard.tsx](file:///d:/Yash%20Coding2/new/PixelPunch/modules/opportunity-audit/questions/OpportunityWizard.tsx) |
| **Wizard Step Slides** | [questions/steps/](file:///d:/Yash%20Coding2/new/PixelPunch/modules/cost-audit/questions/steps/) | [questions/steps/](file:///d:/Yash%20Coding2/new/PixelPunch/modules/opportunity-audit/questions/steps/) |
| **Results Dashboard View**| [ResultsPageContent.tsx](file:///d:/Yash%20Coding2/new/PixelPunch/modules/cost-audit/results/ResultsPageContent.tsx) | [OpportunityResultsContent.tsx](file:///d:/Yash%20Coding2/new/PixelPunch/modules/opportunity-audit/results/OpportunityResultsContent.tsx) |
| **Next.js Landing Route** | [app/ai/cost-scan/page.tsx](file:///d:/Yash%20Coding2/new/PixelPunch/app/ai/cost-scan/page.tsx) | [app/ai/opportunity-scan/page.tsx](file:///d:/Yash%20Coding2/new/PixelPunch/app/ai/opportunity-scan/page.tsx) |
| **Next.js Dashboard Route**| [app/ai/cost-scan/results/page.tsx](file:///d:/Yash%20Coding2/new/PixelPunch/app/ai/cost-scan/results/page.tsx) | [app/ai/opportunity-scan/results/page.tsx](file:///d:/Yash%20Coding2/new/PixelPunch/app/ai/opportunity-scan/results/page.tsx) |
| **POST Submission API** | [app/api/cost-scan/submit/route.ts](file:///d:/Yash%20Coding2/new/PixelPunch/app/api/cost-scan/submit/route.ts) | [app/api/opportunity-scan/submit/route.ts](file:///d:/Yash%20Coding2/new/PixelPunch/app/api/opportunity-scan/submit/route.ts) |
| **GET Retrieval API** | [app/api/cost-scan/result/route.ts](file:///d:/Yash%20Coding2/new/PixelPunch/app/api/cost-scan/result/route.ts) | [app/api/opportunity-scan/result/route.ts](file:///d:/Yash%20Coding2/new/PixelPunch/app/api/opportunity-scan/result/route.ts) |

---

## 2. Shareable Components (`shared/`)

The following files are located in `shared/` to support both modules:
- [WizardUI.tsx](file:///d:/Yash%20Coding2/new/PixelPunch/shared/components/WizardUI.tsx): Holds `OptionCard`, `FieldError`, and `MultiSelectHint` styles.
- [db.service.ts](file:///d:/Yash%20Coding2/new/PixelPunch/shared/database/db.service.ts): Reads and writes submission payloads to the local database store.
- [brevo.service.ts](file:///d:/Yash%20Coding2/new/PixelPunch/shared/utils/brevo.service.ts): Syncs lead details to CRM pipelines.
