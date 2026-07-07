import { ClientDetailClient } from "./client-detail-client";
export const metadata = {
  title: "Client Detail - CRM",
};

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ClientDetailClient clientId={id} />;
}
