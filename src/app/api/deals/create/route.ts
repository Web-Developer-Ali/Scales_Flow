import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { notifyDealAssigned } from "@/lib/notifications";

const VALID_STAGES = [
  "prospect",
  "qualified",
  "demo",
  "negotiation",
  "closed",
] as const;

const VALID_STATUSES = ["active", "won", "lost", "on-hold"] as const;

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  // Only sales reps and managers can create deals
  if (
    !session?.user?.id ||
    !["scales_man", "manager"].includes(session.user.role)
  ) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const body = await req.json();

    const {
      title,
      company,
      contact_person,
      contact_email,
      contact_phone,
      value,
      stage,
      probability,
      expected_close_date,
      description,
      currency = "USD",
      client_id = null,
    } = body;

    // ── Validation ────────────────────────────────────────────────────────────
    if (!company?.trim()) {
      return NextResponse.json(
        { success: false, error: "Company name is required" },
        { status: 400 },
      );
    }

    if (!title?.trim()) {
      return NextResponse.json(
        { success: false, error: "Deal title is required" },
        { status: 400 },
      );
    }

    if (!contact_email?.trim()) {
      return NextResponse.json(
        { success: false, error: "Contact email is required" },
        { status: 400 },
      );
    }

    const dealValue = parseFloat(value);
    if (isNaN(dealValue) || dealValue <= 0) {
      return NextResponse.json(
        { success: false, error: "Valid deal value is required" },
        { status: 400 },
      );
    }

    const dealProbability = parseInt(probability);
    if (
      isNaN(dealProbability) ||
      dealProbability < 0 ||
      dealProbability > 100
    ) {
      return NextResponse.json(
        { success: false, error: "Probability must be between 0 and 100" },
        { status: 400 },
      );
    }

    const dealStage = stage?.toLowerCase();
    if (!VALID_STAGES.includes(dealStage)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid stage. Must be one of: ${VALID_STAGES.join(", ")}`,
        },
        { status: 400 },
      );
    }

    // Validate client_id belongs to this user if provided
    if (client_id) {
      const { rows: clientRows } = await query(
        `SELECT id FROM clients WHERE id = $1 AND (
            assigned_to = $2 OR created_by = $2
          )`,
        [client_id, session.user.id],
      );
      if (!clientRows.length) {
        return NextResponse.json(
          { success: false, error: "Invalid client" },
          { status: 400 },
        );
      }
    }

    // ── Insert ────────────────────────────────────────────────────────────────
    const { rows } = await query(
      `INSERT INTO deals (
        title,
        company,
        contact_person,
        contact_email,
        contact_phone,
        value,
        currency,
        stage,
        status,
        probability,
        expected_close_date,
        description,
        client_id,
        assigned_to,
        created_by
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,
        'active',
        $9,$10,$11,$12,$13,$14
      )
      RETURNING
        id, title, company, value, stage, status,
        probability, created_at`,
      [
        title.trim(),
        company.trim(),
        contact_person?.trim() || null,
        contact_email.trim().toLowerCase(),
        contact_phone?.trim() || null,
        dealValue,
        currency,
        dealStage,
        dealProbability,
        expected_close_date || null,
        description?.trim() || null,
        client_id,
        session.user.id, // assigned_to
        session.user.id, // created_by
      ],
    );

    const deal = rows[0];

    // ── Log to user_activities ─────────────────────────────────────────────
    await query(
      `INSERT INTO user_activities
         (user_id, performed_by, activity_type, description, entity_type, entity_id)
       VALUES ($1, $1, 'deal_created', $2, 'deal', $3)`,
      [
        session.user.id,
        `Created deal: ${deal.title} for ${deal.company}`,
        deal.id,
      ],
    );

    // ── NOTIFICATION ──────────────────────────────────────────────────────────
    // Notify manager that a deal has been created by their rep

    // First, get the user's details including their manager
    const { rows: userRows } = await query(
      `SELECT id, name, manager_id, role FROM users WHERE id = $1`,
      [session.user.id],
    );

    const currentUser = userRows[0];
    const managerId = currentUser?.manager_id;

    // Only send notification if the user has a manager assigned
    if (managerId) {
      await notifyDealAssigned({
        managerId: managerId,
        dealTitle: deal.title,
        dealId: deal.id,
        companyName: deal.company,
      });
    } else {
      // Log that notification was skipped (user doesn't have a manager)
      console.log(
        `Notification skipped: User ${session.user.id} (${currentUser?.name || "Unknown"}) doesn't have a manager assigned`,
      );
    }

    return NextResponse.json({
      success: true,
      message: "Deal created successfully",
      deal,
    });
  } catch (err) {
    console.error("Create Deal API Error:", err);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
