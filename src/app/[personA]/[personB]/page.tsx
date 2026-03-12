import { redirect } from "next/navigation";

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

  return <CompareInputs initialPersonA={initialPersonA} initialPersonB={initialPersonB} />;
}
