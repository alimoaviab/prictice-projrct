import { NextResponse } from "next/server";
import { seedDefaultAdmin } from "@edu/shared/db/seed";

export async function GET() {
  try {
    await seedDefaultAdmin("default-school");
    return NextResponse.json({ message: "Default admin seeded successfully" });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json({ message: "Seed failed", error: String(error) }, { status: 500 });
  }
}
