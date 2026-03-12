import { redirect } from "next/navigation";

import { buildComparisonPathFromIds } from "@/lib/routing/comparison-url";

type LegacyComparisonPageProps = {
  params: Promise<{
    personAId: string;
    personBId: string;
  }>;
};

export default async function LegacyComparisonPage({ params }: LegacyComparisonPageProps) {
  const { personAId, personBId } = await params;

  const leftId = Number(personAId);
  const rightId = Number(personBId);

  if (!Number.isInteger(leftId) || !Number.isInteger(rightId) || leftId <= 0 || rightId <= 0 || leftId === rightId) {
    redirect("/");
  }

  redirect(buildComparisonPathFromIds(leftId, rightId));
}
