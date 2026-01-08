import { DashboardHeader } from "@/components/admin_dashboard/dashboard-header"
import { DealPipeline } from "@/components/admin_dashboard/deal-pipeline"
import { RecentDeals } from "@/components/admin_dashboard/recent-deals"
import { SalesMetrics } from "@/components/admin_dashboard/sales-metrics"
import { TeamPerformance } from "@/components/admin_dashboard/team-performance"

export const metadata = {
  title: "CRM Admin Dashboard",
  description: "Track deals from first contact to closed sale",
}

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-background">
      <DashboardHeader />

      <div className="px-6 py-8">
        {/* Sales Metrics Overview */}
        <SalesMetrics />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          {/* Deal Pipeline */}
          <div className="lg:col-span-2">
            <DealPipeline />
          </div>

          {/* Team Performance */}
          <div className="lg:col-span-1">
            <TeamPerformance />
          </div>
        </div>

        {/* Recent Deals */}
        <div className="mt-8">
          <RecentDeals />
        </div>
      </div>
    </main>
  )
}
