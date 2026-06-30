import { RepPerformanceClient } from "./rep-performance-client";

export const metadata = {
  title: "My Performance - CRM",
  description: "Your sales performance history and trends",
};

export default function RepPerformancePage() {
  return <RepPerformanceClient />;
}
