"use client";

// app/result/opportunity/page.tsx
import { Suspense } from 'react';
import { Logger } from '@/shared/utils/logger';
import dynamic from 'next/dynamic';

const DynamicOpportunityResultsContent = dynamic(
  () => import('@/modules/opportunity-audit/results/OpportunityResultsContent'),
  { ssr: false }
);

export default function OpportunityResultPage() {
  Logger.info("[OpportunityResultPage] Rendering");
  return (
    <div>
      <h1>Hello from OpportunityResultPage!</h1>
      <DynamicOpportunityResultsContent />
    </div>
  );
}
