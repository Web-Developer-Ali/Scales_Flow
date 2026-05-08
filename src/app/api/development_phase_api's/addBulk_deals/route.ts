import { NextResponse } from "next/server";
import { query } from "@/lib/db";

const USER_ID = "68095286-eebd-4618-bd0c-0514403f7825";

// 🎯 FIXED MONTH: MAY 2026
const FIXED_MONTH = new Date("2026-05-01");

const FIRST_NAMES = ["Ali", "Ahmed", "Usman", "Zain", "Hassan"];
const LAST_NAMES = ["Khan", "Malik", "Sheikh", "Raza", "Farooq"];

const COMPANIES = [
  "Nova Solutions",
  "Apex Corp",
  "BlueTech Systems",
  "NextGen Ltd",
  "PrimeSoft",
];

function weightedStage() {
  const r = Math.random();

  if (r < 0.35) return "prospect";
  if (r < 0.6) return "qualified";
  if (r < 0.8) return "demo";
  if (r < 0.95) return "negotiation";

  return "closed";
}

function random<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateName() {
  return `${random(FIRST_NAMES)} ${random(LAST_NAMES)}`;
}

function generateEmail(name: string) {
  return name.toLowerCase().replace(/\s+/g, ".") + "@example.com";
}

export async function POST() {
  // 🔐 DEVELOPMENT ONLY
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      {
        success: false,
        error: "Not allowed in production",
      },
      { status: 403 },
    );
  }

  try {
    const deals: unknown[] = [];

    for (let i = 0; i < 20; i++) {
      const stage = weightedStage();

      // 🎯 Probability based on stage
      let probability = 0;

      switch (stage) {
        case "prospect":
          probability = 10;
          break;

        case "qualified":
          probability = 30;
          break;

        case "demo":
          probability = 55;
          break;

        case "negotiation":
          probability = 80;
          break;

        case "closed":
          probability = 100;
          break;
      }

      // 🎯 Status logic
      let status = "active";

      if (stage === "closed") {
        status = Math.random() > 0.5 ? "won" : "lost";
      }

      // 💰 Deal value logic
      let value = 0;

      switch (stage) {
        case "prospect":
          value = randomBetween(1000, 5000);
          break;

        case "qualified":
          value = randomBetween(5000, 15000);
          break;

        case "demo":
          value = randomBetween(15000, 30000);
          break;

        case "negotiation":
          value = randomBetween(30000, 60000);
          break;

        case "closed":
          value = randomBetween(20000, 80000);
          break;
      }

      const name = generateName();
      const company = random(COMPANIES);

      // 📅 Random dates inside MAY 2026
      const createdAt = new Date(FIXED_MONTH);
      createdAt.setDate(randomBetween(1, 28));

      const updatedAt = new Date(createdAt);
      updatedAt.setDate(createdAt.getDate() + randomBetween(1, 10));

      const expectedCloseDate = new Date(updatedAt);
      expectedCloseDate.setDate(updatedAt.getDate() + randomBetween(5, 20));

      // 🎯 generated_month
      const generatedMonth = "2026-05-01";

      deals.push([
        `${stage.toUpperCase()} Deal #${i + 1}`,
        company,
        name,
        generateEmail(name),
        `+923${randomBetween(100000000, 499999999)}`,
        value,
        "USD",
        status,
        stage,
        probability,
        expectedCloseDate.toISOString().split("T")[0],
        USER_ID,
        USER_ID,
        createdAt.toISOString(),
        updatedAt.toISOString(),
        generatedMonth,
      ]);
    }

    // ⚡ BULK INSERT
    const values: string[] = [];
    const flatValues: unknown[] = [];

    deals.forEach((deal, index) => {
      const offset = index * 16;

      values.push(`
        (
          $${offset + 1},
          $${offset + 2},
          $${offset + 3},
          $${offset + 4},
          $${offset + 5},
          $${offset + 6},
          $${offset + 7},
          $${offset + 8},
          $${offset + 9},
          $${offset + 10},
          $${offset + 11},
          $${offset + 12},
          $${offset + 13},
          $${offset + 14},
          $${offset + 15},
          $${offset + 16}
        )
      `);

      flatValues.push(...(deal as unknown[]));
    });

    await query(
      `
      INSERT INTO deals (
        title,
        company,
        contact_person,
        contact_email,
        contact_phone,
        value,
        currency,
        status,
        stage,
        probability,
        expected_close_date,
        assigned_to,
        created_by,
        created_at,
        updated_at,
        generated_month
      )
      VALUES ${values.join(",")}
      `,
      flatValues,
    );

    return NextResponse.json({
      success: true,
      inserted: deals.length,
      message: "20 realistic deals inserted for May 2026 🚀",
    });
  } catch (err) {
    console.error("Seed Error:", err);

    return NextResponse.json(
      {
        success: false,
        error: "Internal Server Error",
      },
      { status: 500 },
    );
  }
}
