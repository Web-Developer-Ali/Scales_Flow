import { RecentDeals } from "@/components/admin_dashboard/recent-deals";
import { RepDashboardHeader } from "@/components/salesRep_dashboard/rep-dashboard-header";
import { RepMetrics } from "@/components/salesRep_dashboard/rep-metrics";
import { RepPipeline } from "@/components/salesRep_dashboard/rep-pipeline";
import { TasksAndActivities } from "@/components/salesRep_dashboard/tasks-and-activities";

export const metadata = {
  title: "CRM Sales Rep Dashboard",
  description: "Track your deals, tasks, and performance metrics",
};

export default function RepDashboardPage() {
  return (
    <main className="min-h-screen bg-background">
      <RepDashboardHeader />

      <div className="px-6 py-8">
        {/* Rep Metrics */}
        <RepMetrics />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          {/* Pipeline and Recent Deals */}
          <div className="lg:col-span-2 space-y-6">
            <RepPipeline />
            <RecentDeals />
          </div>

          {/* Tasks and Activities */}
          <div className="lg:col-span-1">
            <TasksAndActivities />
          </div>
        </div>
      </div>
    </main>
  );
}
