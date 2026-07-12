import { Pool } from "pg";
import bcrypt from "bcryptjs";

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ??
    "postgresql://neondb_owner:npg_tB8US2mRsgaF@ep-jolly-sky-aq41gd1y-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
});

// ── Config ────────────────────────────────────────────────────────────────────
const CONFIG = {
  managers: 5,
  repsPerManager: 10, // 50 reps total — simulates 55-person agency
  dealsPerRep: 200, // 10,000 total deals
  clientsPerRep: 40, // 2,000 total clients
  monthsOfHistory: 18, // 18 months of data
};

// ── Realistic data pools ──────────────────────────────────────────────────────
const COMPANIES = [
  "Apex Corp",
  "Nova Solutions",
  "BlueTech Systems",
  "PrimeSoft",
  "NextGen Ltd",
  "CloudBase Inc",
  "DataFlow Co",
  "SwiftMedia",
  "PixelForge",
  "AdVance Agency",
  "GrowthLab",
  "TargetPro",
  "ReachMax",
  "ConvertHub",
  "LeadStream",
  "FunnelPeak",
  "MetricsMind",
  "BrandPulse",
  "ClickMatrix",
  "ScaleUp Digital",
  "ProMedia Group",
  "AdNexus",
  "FlowBoost",
  "ROImaster",
  "DigitalEdge",
  "PerfMax",
  "CampaignPro",
  "TrafficGrid",
];

const FIRST_NAMES = [
  "Ahmed",
  "Ali",
  "Hassan",
  "Usman",
  "Zain",
  "Omar",
  "Bilal",
  "Sarah",
  "Emma",
  "Sofia",
  "Maria",
  "Aisha",
  "Fatima",
  "Zara",
  "James",
  "David",
  "Michael",
  "Chris",
  "Ryan",
  "Daniel",
];

const LAST_NAMES = [
  "Khan",
  "Raza",
  "Sheikh",
  "Malik",
  "Farooq",
  "Hamza",
  "Smith",
  "Johnson",
  "Williams",
  "Brown",
  "Davis",
  "Miller",
];

const INDUSTRIES = [
  "E-commerce",
  "SaaS",
  "Healthcare",
  "Real Estate",
  "Finance",
  "Education",
  "Retail",
  "Logistics",
  "Hospitality",
  "Legal",
];

const STAGES: Array<
  "prospect" | "qualified" | "demo" | "negotiation" | "closed"
> = ["prospect", "qualified", "demo", "negotiation", "closed"];

const STAGE_WEIGHTS = [0.3, 0.25, 0.2, 0.15, 0.1]; // realistic distribution

const STATUSES: Array<"active" | "won" | "lost" | "on-hold"> = [
  "active",
  "won",
  "lost",
  "on-hold",
];

const STATUS_WEIGHTS = [0.55, 0.2, 0.15, 0.1];

// ── Helpers ───────────────────────────────────────────────────────────────────
function rng(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[], weights?: number[]): T {
  if (!weights) return arr[Math.floor(Math.random() * arr.length)];
  const r = Math.random();
  let sum = 0;
  for (let i = 0; i < arr.length; i++) {
    sum += weights[i];
    if (r < sum) return arr[i];
  }
  return arr[arr.length - 1];
}

function randomName() {
  return `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
}

function randomEmail(name: string, idx: number) {
  return `${name.toLowerCase().replace(/\s/g, ".")}${idx}@example.com`;
}

// Random date within the last N months, slightly skewed to recent
function randomDate(monthsBack: number): Date {
  const now = new Date();
  const msBack = monthsBack * 30 * 24 * 60 * 60 * 1000;
  const offset = Math.random() * msBack;
  return new Date(now.getTime() - offset);
}

// ── Main seed ─────────────────────────────────────────────────────────────────
async function seed() {
  const client = await pool.connect();

  try {
    console.log("🌱 Starting seed...\n");

    // ── 1. Admin ───────────────────────────────────────────────────────────
    console.log("Creating admin...");
    const adminHash = await bcrypt.hash("Admin123!", 10);

    const {
      rows: [admin],
    } = await client.query(
      `
      INSERT INTO users (email, password_hash, name, role, is_active, is_verified)
      VALUES ('admin@salesflow.test', $1, 'Admin User', 'admin', true, true)
      ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
      RETURNING id
    `,
      [adminHash],
    );

    const adminId = admin.id;
    console.log(`  ✅ Admin: admin@salesflow.test / Admin123!\n`);

    // ── 2. Managers ────────────────────────────────────────────────────────
    console.log(`Creating ${CONFIG.managers} managers...`);
    const managerIds: string[] = [];
    const pwHash = await bcrypt.hash("Password123!", 10);

    for (let m = 0; m < CONFIG.managers; m++) {
      const name = randomName();
      const email = randomEmail(name, m);
      const {
        rows: [mgr],
      } = await client.query(
        `
        INSERT INTO users
          (email, password_hash, name, role, is_active, is_verified, created_by)
        VALUES ($1, $2, $3, 'manager', true, true, $4)
        ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
        RETURNING id
      `,
        [email, pwHash, name, adminId],
      );
      managerIds.push(mgr.id);
    }
    console.log(`  ✅ ${CONFIG.managers} managers created\n`);

    // ── 3. Sales Reps ──────────────────────────────────────────────────────
    console.log(
      `Creating ${CONFIG.managers * CONFIG.repsPerManager} sales reps...`,
    );
    const repIds: string[] = [];

    for (let m = 0; m < CONFIG.managers; m++) {
      for (let r = 0; r < CONFIG.repsPerManager; r++) {
        const name = randomName();
        const idx = m * CONFIG.repsPerManager + r;
        const email = randomEmail(name, idx + 100);
        const {
          rows: [rep],
        } = await client.query(
          `
          INSERT INTO users
            (email, password_hash, name, role, is_active, is_verified,
             created_by, manager_id)
          VALUES ($1, $2, $3, 'scales_man', true, true, $4, $5)
          ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
          RETURNING id
        `,
          [email, pwHash, name, managerIds[m], managerIds[m]],
        );
        repIds.push(rep.id);
      }
    }
    console.log(`  ✅ ${repIds.length} sales reps created\n`);

    // ── 4. Clients ─────────────────────────────────────────────────────────
    console.log(`Creating ~${repIds.length * CONFIG.clientsPerRep} clients...`);
    const clientIds: string[] = [];
    const clientStatuses = ["prospect", "active", "inactive"];
    const clientStatusWeights = [0.3, 0.55, 0.15];

    const clientValues: unknown[][] = [];
    for (const repId of repIds) {
      for (let c = 0; c < CONFIG.clientsPerRep; c++) {
        const company = `${pick(COMPANIES)} ${rng(1, 999)}`;
        const contact = randomName();
        const industry = pick(INDUSTRIES);
        const status = pick(clientStatuses, clientStatusWeights);
        clientValues.push([
          company,
          industry,
          contact,
          `${contact.toLowerCase().replace(/\s/g, ".")}@client.com`,
          status,
          repId,
          repId,
        ]);
      }
    }

    // Batch insert clients in chunks of 500
    const CHUNK = 500;
    for (let i = 0; i < clientValues.length; i += CHUNK) {
      const chunk = clientValues.slice(i, i + CHUNK);
      const params: unknown[] = [];
      const placeholders = chunk.map((_, ci) => {
        const base = ci * 7;
        params.push(...chunk[ci]);
        return `($${base + 1},$${base + 2},$${base + 3},$${base + 4},$${base + 5}::client_status,$${base + 6},$${base + 7})`;
      });
      const { rows: inserted } = await client.query(
        `
        INSERT INTO clients
          (company_name, industry, primary_contact_name, primary_contact_email,
           status, assigned_to, created_by)
        VALUES ${placeholders.join(",")}
        RETURNING id
      `,
        params,
      );
      clientIds.push(...inserted.map((r: { id: string }) => r.id));
    }
    console.log(`  ✅ ${clientIds.length} clients created\n`);

    // ── 5. Deals ───────────────────────────────────────────────────────────
    const totalDeals = repIds.length * CONFIG.dealsPerRep;
    console.log(`Creating ${totalDeals} deals (this takes a moment)...`);

    let dealCount = 0;
    const DEAL_CHUNK = 200;
    const dealValues: unknown[][] = [];

    for (const repId of repIds) {
      // Assign some clients to this rep
      const repClientPool = clientIds
        .sort(() => Math.random() - 0.5)
        .slice(0, CONFIG.clientsPerRep);

      for (let d = 0; d < CONFIG.dealsPerRep; d++) {
        const company = pick(COMPANIES);
        const stage = pick(STAGES, STAGE_WEIGHTS);
        const status = pick(STATUSES, STATUS_WEIGHTS);
        const value = rng(500, 150_000);
        const prob =
          stage === "prospect"
            ? rng(5, 25)
            : stage === "qualified"
              ? rng(25, 45)
              : stage === "demo"
                ? rng(40, 65)
                : stage === "negotiation"
                  ? rng(60, 85)
                  : rng(85, 100);
        const contact = randomName();
        const createdAt = randomDate(CONFIG.monthsOfHistory);
        const updatedAt = new Date(
          createdAt.getTime() + rng(0, 30) * 24 * 60 * 60 * 1000,
        );
        const clientId =
          Math.random() > 0.4
            ? repClientPool[rng(0, repClientPool.length - 1)]
            : null;

        dealValues.push([
          `Deal — ${company}`,
          company,
          contact,
          `${contact.toLowerCase().replace(/\s/g, ".")}@${company.toLowerCase().replace(/\s/g, "")}.com`,
          value,
          stage,
          status,
          prob,
          clientId,
          repId,
          repId,
          createdAt.toISOString(),
          updatedAt.toISOString(),
        ]);
      }
    }

    // Batch insert deals in chunks
    for (let i = 0; i < dealValues.length; i += DEAL_CHUNK) {
      const chunk = dealValues.slice(i, i + DEAL_CHUNK);
      const params: unknown[] = [];
      const placeholders = chunk.map((_, ci) => {
        const row = chunk[ci];
        const base = ci * 13;
        params.push(...row);
        return `(
          $${base + 1},$${base + 2},$${base + 3},$${base + 4},
          $${base + 5},$${base + 6}::deal_stage,$${base + 7}::deal_status,
          $${base + 8},$${base + 9},$${base + 10},$${base + 11},
          $${base + 12}::timestamptz,$${base + 13}::timestamptz,
          DATE_TRUNC('month',$${base + 12}::timestamptz)::date
        )`;
      });

      await client.query(
        `
        INSERT INTO deals
          (title, company, contact_person, contact_email,
           value, stage, status, probability,
           client_id, assigned_to, created_by,
           created_at, updated_at, generated_month)
        VALUES ${placeholders.join(",")}
      `,
        params,
      );

      dealCount += chunk.length;
      process.stdout.write(`\r  Inserted ${dealCount}/${totalDeals} deals...`);
    }

    console.log(`\n  ✅ ${dealCount} deals created\n`);

    // ── 6. Summary ─────────────────────────────────────────────────────────
    const { rows: counts } = await client.query(`
      SELECT
        (SELECT COUNT(*) FROM users)   AS users,
        (SELECT COUNT(*) FROM deals)   AS deals,
        (SELECT COUNT(*) FROM clients) AS clients
    `);

    console.log("─────────────────────────────────");
    console.log("✅ Seed complete!\n");
    console.log(`Users:   ${counts[0].users}`);
    console.log(`Deals:   ${counts[0].deals}`);
    console.log(`Clients: ${counts[0].clients}`);
    console.log("─────────────────────────────────");
    console.log("\n🔑 Login credentials:");
    console.log("  Admin:   admin@salesflow.test  / Admin123!");
    console.log("  Others:  Password123!\n");
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
