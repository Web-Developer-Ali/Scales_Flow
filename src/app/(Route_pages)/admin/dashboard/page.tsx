"use client";

import { DashboardHeader } from "@/components/admin_dashboard/dashboard-header";
import { DealPipeline } from "@/components/admin_dashboard/deal-pipeline";
import { RecentDeals } from "@/components/admin_dashboard/recent-deals";
import { SalesMetrics } from "@/components/admin_dashboard/sales-metrics";
import { TeamPerformance } from "@/components/admin_dashboard/team-performance";
import { useDashboardData } from "@/components/admin_dashboard/use-dashboard-data";

export default function DashboardPage() {
  const { data, loading } = useDashboardData();

  return (
    <main className="min-h-screen bg-background">
      <DashboardHeader />

      <div className="px-6 py-8">
        <SalesMetrics
          totalPipeline={data?.metrics.totalPipeline}
          closedThisMonth={data?.metrics.closedThisMonth}
          targetProgress={data?.metrics.targetProgress}
          avgCloseTime={data?.metrics.avgCloseTime}
          isLoading={loading}
        />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          <div className="lg:col-span-2">
            <DealPipeline data={data?.pipelineByStage} isLoading={loading} />
          </div>

          <div className="lg:col-span-1">
            <TeamPerformance data={data?.teamPerformance} isLoading={loading} />
          </div>
        </div>

        <div className="mt-8">
          <RecentDeals data={data?.recentDeals} isLoading={loading} />
        </div>
      </div>
    </main>
  );
}
