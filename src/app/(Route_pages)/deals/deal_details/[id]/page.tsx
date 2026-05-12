import { DealDetailClient } from "./deal-detail-client";

export const metadata = {
  title: "Deal Detail - CRM",
};

export default async function DealDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <DealDetailClient dealId={id} />;
}
