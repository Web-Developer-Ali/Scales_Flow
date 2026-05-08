"use client";

import { ManagerDashboardHeader } from "@/components/manager_dashboard/manager-dashboard-header";
import { ManagerMetrics } from "@/components/manager_dashboard/manager-metrics";
import { PersonalPipeline } from "@/components/manager_dashboard/personal-pipeline";
import { TeamActivities } from "@/components/manager_dashboard/team-activities";
import { TeamOverview } from "@/components/manager_dashboard/team-overview";
import { useManagerDashboard } from "@/components/manager_dashboard/use-manager-dashboard";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ManagerDashboardPage() {
  const { data, loading, error } = useManagerDashboard();

  return (
    <main className="min-h-screen bg-background">
      <ManagerDashboardHeader />

      <div className="px-6 py-8">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <ManagerMetrics
          personal={data?.personal}
          team={data?.team}
          isLoading={loading}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          <div className="lg:col-span-2">
            <TeamOverview
              data={data?.repPerformance}
              target={data?.team.target ?? 20}
              isLoading={loading}
            />
          </div>
          <div className="lg:col-span-1">
            <PersonalPipeline
              deals={data?.personal.deals}
              totalPipeline={data?.personal.pipeline}
              isLoading={loading}
            />
          </div>
        </div>

        <div className="mt-8">
          <TeamActivities data={data?.teamRecent} isLoading={loading} />
        </div>
      </div>
    </main>
  );
}
