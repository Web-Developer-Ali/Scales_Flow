import { ManagerDealsClient } from "./manager-deals-client";

export const metadata = {
  title: "Team Deals - Manager",
  description: "View and manage your team's deals",
};

export default function ManagerDealsPage() {
  return <ManagerDealsClient />;
}
