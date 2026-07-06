"use client";

import { ManagerDashboardHeader } from "@/components/manager/manager-dashboard-header";
import { ActivityFeed } from "@/components/shared/activity-feed";

function getEntityRoute(
  entityType: string | null,
  entityId: string | null,
): string | null {
  if (!entityType || !entityId) return null;
  if (entityType === "deal") return `/scales_man/deal_details/${entityId}`;
  if (entityType === "client") return `/scales_man/clients/${entityId}`;
  return null;
}

export function ManagerActivityClient() {
  return (
    <main className="min-h-screen bg-background">
      <ManagerDashboardHeader />
      <div className="border-b border-border bg-card/50">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <h1 className="text-3xl font-bold text-foreground">Team Activity</h1>
          <p className="text-muted-foreground mt-1">
            Everything your team has done — newest first
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <ActivityFeed role="manager" getEntityRoute={getEntityRoute} />
      </div>
    </main>
  );
}
