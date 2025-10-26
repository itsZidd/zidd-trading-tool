import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const dataDir = path.join(process.cwd(), "app", "data");

    // ensure directory exists
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const filePath = path.join(dataDir, "cot-report.json");
    fs.writeFileSync(filePath, JSON.stringify(body, null, 2));

    return NextResponse.json({
      message: "Saved successfully",
      filename: "cot-report.json",
    });
  } catch (error) {
    console.error("Error saving COT data:", error);
    return NextResponse.json({ error: "Failed to save data" }, { status: 500 });
  }
}
