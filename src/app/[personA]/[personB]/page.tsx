import { Suspense } from "react";
import { redirect } from "next/navigation";

import { PosterGrid } from "@/components/background/PosterGrid";
import { CompareInputs } from "@/components/compare/CompareInputs";
import { createInitialPersonFromSegment } from "@/lib/routing/comparison-url";

type ComparisonPageProps = {
  params: Promise<{
    personA: string;
    personB: string;
  }>;
};

export default async function ComparisonPage({ params }: ComparisonPageProps) {
  const { personA, personB } = await params;

  const initialPersonA = createInitialPersonFromSegment(personA);
  const initialPersonB = createInitialPersonFromSegment(personB);

  if (!initialPersonA || !initialPersonB || initialPersonA.id === initialPersonB.id) {
    redirect("/");
  }

  return (
    <main className="relative min-h-screen bg-white text-stone-900">
      <PosterGrid
        centerContent={
          <Suspense fallback={<div className="text-sm text-stone-600">Loading comparison tools...</div>}>
            <CompareInputs initialPersonA={initialPersonA} initialPersonB={initialPersonB} />
          </Suspense>
        }
      />
    </main>
  );
}
