// app/result/opportunity/page.tsx
import { Suspense } from 'react';
import OpportunityResultsContent from '@/modules/opportunity-audit/results/OpportunityResultsContent';

export default function OpportunityResultPage() {
  console.log("[OpportunityResultPage] Rendering");
  return (
    <div>
      <h1>Hello from OpportunityResultPage!</h1>
        <OpportunityResultsContent />
    </div>
  );
}
