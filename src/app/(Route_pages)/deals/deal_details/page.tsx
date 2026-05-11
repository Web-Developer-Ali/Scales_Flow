import { DealDetailClient } from "./deal-detail-client";

export default function DealDetailPage({ params }: { params: { id: string } }) {
  return <DealDetailClient dealId={params.id} />;
}
