import { TeamManagementPageClient } from "./team-management-client";

export const metadata = {
  title: "Team Management - CRM Admin",
  description: "Create and manage managers and sales representatives",
};

export default function TeamManagementPage() {
  return <TeamManagementPageClient />;
}
