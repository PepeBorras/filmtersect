import { Suspense } from "react";

import { PosterGrid } from "@/components/background/PosterGrid";
import { CompareInputs } from "@/components/compare/CompareInputs";

export default function Home() {
  return (
    <main className="relative min-h-screen bg-white text-stone-900">
      <PosterGrid
        centerContent={
          <Suspense fallback={<div className="text-sm text-stone-600">Loading comparison tools...</div>}>
            <CompareInputs />
          </Suspense>
        }
      />
    </main>
  );
}
