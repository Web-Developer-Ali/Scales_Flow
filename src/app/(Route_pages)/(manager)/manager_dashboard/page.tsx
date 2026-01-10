import { ManagerDashboardHeader } from "@/components/manager_dashboard/manager-dashboard-header";
import { ManagerMetrics } from "@/components/manager_dashboard/manager-metrics";
import { PersonalPipeline } from "@/components/manager_dashboard/personal-pipeline";
import { TeamActivities } from "@/components/manager_dashboard/team-activities";
import { TeamOverview } from "@/components/manager_dashboard/team-overview";

export const metadata = {
  title: "CRM Manager Dashboard",
  description: "Manage team performance and personal sales pipeline",
};

export default function ManagerDashboardPage() {
  return (
    <main className="min-h-screen bg-background">
      <ManagerDashboardHeader />

      <div className="px-6 py-8">
        {/* Manager Metrics */}
        <ManagerMetrics />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          {/* Team Overview */}
          <div className="lg:col-span-2">
            <TeamOverview />
          </div>

          {/* Personal Pipeline */}
          <div className="lg:col-span-1">
            <PersonalPipeline />
          </div>
        </div>

        {/* Team Activities */}
        <div className="mt-8">
          <TeamActivities />
        </div>
      </div>
    </main>
  );
}
