"use client";

import { RepDashboardHeader } from "@/components/salesRep_dashboard/rep-dashboard-header";
import { RepMetrics } from "@/components/salesRep_dashboard/rep-metrics";
import { RepPipeline } from "@/components/salesRep_dashboard/rep-pipeline";
import { useRepDashboard } from "@/components/salesRep_dashboard/use-rep-dashboard";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RepRecentDeals } from "@/components/salesRep_dashboard/recent-deals";
import { NeedsAttention } from "@/components/salesRep_dashboard/needs-attention";

export default function RepDashboardPage() {
  const { data, loading, error } = useRepDashboard();

  return (
    <main className="min-h-screen bg-background">
      <RepDashboardHeader />

      <div className="px-6 py-8">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <RepMetrics metrics={data?.metrics} isLoading={loading} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          <div className="lg:col-span-2 space-y-6">
            <RepPipeline
              stageBreakdown={data?.stageBreakdown}
              monthlyTrend={data?.monthlyTrend}
              isLoading={loading}
            />
            <RepRecentDeals data={data?.recentDeals} isLoading={loading} />
          </div>
          <div className="lg:col-span-1">
            <NeedsAttention data={data?.needsAttention} isLoading={loading} />
          </div>
        </div>
      </div>
    </main>
  );
}
