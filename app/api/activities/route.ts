// app/api/activities/route.ts
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Path to JSON file
const filePath = path.join(process.cwd(), "db", "activities.json");

// GET - Read activities
export async function GET() {
  try {
    const data = fs.readFileSync(filePath, "utf-8");
    const activities = JSON.parse(data);
    return NextResponse.json(activities);
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to load activities." },
      { status: 500 }
    );
  }
}

// POST - Save activities
export async function POST(req: Request) {
  try {
    const activities = await req.json();
    fs.writeFileSync(filePath, JSON.stringify(activities, null, 2));
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to save activities." },
      { status: 500 }
    );
  }
}
