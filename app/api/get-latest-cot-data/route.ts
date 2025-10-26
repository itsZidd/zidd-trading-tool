import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "app", "data", "cot-report.json");

    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: "No COT data file found" },
        { status: 404 }
      );
    }

    const fileContent = fs.readFileSync(filePath, "utf-8");
    const jsonData = JSON.parse(fileContent);

    return NextResponse.json(jsonData);
  } catch (error) {
    console.error("Error reading cot-report.json:", error);
    return NextResponse.json(
      { error: "Failed to load COT data" },
      { status: 500 }
    );
  }
}
