import { Suspense } from 'react';
import OpportunityResultsContent from '@/modules/opportunity-audit/results/OpportunityResultsContent';

export default function OpportunityResultPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OpportunityResultsContent />
    </Suspense>
  );
}
