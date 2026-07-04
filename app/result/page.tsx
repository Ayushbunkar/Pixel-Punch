import { Suspense } from 'react';
import ResultPage from "@/modules/results/ResultPage";

export default function Result() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResultPage />
    </Suspense>
  );
}
