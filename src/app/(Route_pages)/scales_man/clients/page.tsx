import { ClientsClient } from "./clients-client";

export const metadata = {
  title: "Clients - CRM",
  description: "Manage your client relationships",
};

export default function ClientsPage() {
  return <ClientsClient />;
}
