"use client";

import { AdminNavbar } from "@/components/admin/navbar";
import { ActivityFeed } from "@/components/shared/activity-feed";

// Admin can navigate to any deal regardless of who owns it
function getEntityRoute(
  entityType: string | null,
  entityId: string | null,
): string | null {
  if (!entityType || !entityId) return null;
  if (entityType === "deal") return `/scales_man/deal_details/${entityId}`;
  if (entityType === "client") return `/scales_man/clients/${entityId}`;
  if (entityType === "user") return `/admin/team`;
  return null;
}

export function AdminActivityClient() {
  return (
    <main className="min-h-screen bg-background">
      <AdminNavbar />
      <div className="border-b border-border bg-card/50">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <h1 className="text-3xl font-bold text-foreground">Activity Feed</h1>
          <p className="text-muted-foreground mt-1">
            Full audit log of everything your team has done
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <ActivityFeed role="admin" getEntityRoute={getEntityRoute} />
      </div>
    </main>
  );
}
