import { ManagerActivityClient } from "./manager-activity-client";

export const metadata = {
  title: "Team Activity - Manager",
  description: "See what your team has been doing",
};

export default function ManagerActivityPage() {
  return <ManagerActivityClient />;
}
