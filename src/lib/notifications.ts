import { query } from "@/lib/db";

type NotificationType =
  | "deal_assigned"
  | "deal_stage_changed"
  | "deal_won"
  | "deal_lost"
  | "deal_stalled"
  | "monthly_target_reminder"
  | "team_member_created"
  | "deal_commented";

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
}

// ── Core: create a single notification ───────────────────────────────────────
export async function createNotification(p: CreateNotificationParams) {
  try {
    await query(
      `INSERT INTO notifications
         (user_id, type, title, message, entity_type, entity_id)
       VALUES ($1, $2::notification_type, $3, $4, $5, $6)`,
      [
        p.userId,
        p.type,
        p.title,
        p.message,
        p.entityType ?? null,
        p.entityId ?? null,
      ],
    );
  } catch (err) {
    // Notifications are non-critical — log but never throw
    // so a notification failure never breaks the main action
    console.error("Failed to create notification:", err);
  }
}

// ── Specific notification helpers ─────────────────────────────────────────────
// Call these from your deal and user API routes

export async function notifyDealAssigned(params: {
  managerId: string;
  dealTitle: string;
  dealId: string;
  companyName: string;
}) {
  await createNotification({
    userId: params.managerId,
    type: "deal_assigned",
    title: "New Deal Assigned",
    message: `You've been assigned a new deal: ${params.dealTitle} — ${params.companyName}`,
    entityType: "deal",
    entityId: params.dealId,
  });
}

export async function notifyDealStageChanged(params: {
  managerId: string;
  repName: string;
  dealTitle: string;
  dealId: string;
  fromStage: string;
  toStage: string;
}) {
  await createNotification({
    userId: params.managerId,
    type: "deal_stage_changed",
    title: "Deal Stage Updated",
    message: `${params.repName} moved "${params.dealTitle}" from ${params.fromStage} → ${params.toStage}`,
    entityType: "deal",
    entityId: params.dealId,
  });
}

export async function notifyDealWon(params: {
  managerId: string;
  repName: string;
  dealTitle: string;
  dealId: string;
  dealValue: number;
  companyName: string;
}) {
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(params.dealValue);

  await createNotification({
    userId: params.managerId,
    type: "deal_won",
    title: "🎉 Deal Won!",
    message: `${params.repName} closed "${params.dealTitle}" — ${params.companyName} for ${formatted}`,
    entityType: "deal",
    entityId: params.dealId,
  });
}

export async function notifyDealLost(params: {
  managerId: string;
  repName: string;
  dealTitle: string;
  dealId: string;
  companyName: string;
}) {
  await createNotification({
    userId: params.managerId,
    type: "deal_lost",
    title: "Deal Lost",
    message: `${params.repName} marked "${params.dealTitle}" — ${params.companyName} as lost`,
    entityType: "deal",
    entityId: params.dealId,
  });
}

export async function notifyDealStalled(params: {
  repId: string;
  dealTitle: string;
  dealId: string;
  daysStale: number;
  stage: string;
}) {
  await createNotification({
    userId: params.repId,
    type: "deal_stalled",
    title: "Deal Needs Attention",
    message: `"${params.dealTitle}" has been in ${params.stage} for ${params.daysStale} days without any updates`,
    entityType: "deal",
    entityId: params.dealId,
  });
}

export async function notifyTeamMemberCreated(params: {
  managerId: string;
  newRepName: string;
  newRepId: string;
  role: string;
}) {
  await createNotification({
    userId: params.managerId,
    type: "team_member_created",
    title: "New Team Member",
    message: `${params.newRepName} has been added as a ${params.role} and assigned to your team`,
    entityType: "user",
    entityId: params.newRepId,
  });
}

export async function notifyMonthlyTarget(params: {
  repId: string;
  closedDeals: number;
  totalCreated: number;
  percent: number;
}) {
  await createNotification({
    userId: params.repId,
    type: "monthly_target_reminder",
    title: "Monthly Target Check-in",
    message: `You've closed ${params.closedDeals} of ${params.totalCreated} deals this month (${params.percent}%). Keep pushing!`,
  });
}
