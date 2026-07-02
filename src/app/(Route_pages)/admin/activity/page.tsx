import { AdminActivityClient } from "./admin-activity-client";

export const metadata = {
  title: "Activity Feed - Admin",
  description: "Full audit log of team activity",
};

export default function AdminActivityPage() {
  return <AdminActivityClient />;
}
