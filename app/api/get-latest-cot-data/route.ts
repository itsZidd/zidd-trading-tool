import { NextRequest, NextResponse } from "next/server";
import { readdir, readFile } from "fs/promises";
import path from "path";

export async function GET(request: NextRequest) {
  try {
    const dataDir = path.join(process.cwd(), "data");

    // Read all files in data directory
    const files = await readdir(dataDir);

    // Filter for COT report JSON files and sort by name (timestamp)
    const cotFiles = files
      .filter(
        (file) => file.startsWith("cot-report-") && file.endsWith(".json")
      )
      .sort()
      .reverse(); // Most recent first

    if (cotFiles.length === 0) {
      return NextResponse.json({ error: "No COT data found" }, { status: 404 });
    }

    // Read the latest file
    const latestFile = cotFiles[0];
    const filepath = path.join(dataDir, latestFile);
    const fileContent = await readFile(filepath, "utf-8");
    const data = JSON.parse(fileContent);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching COT data:", error);
    return NextResponse.json(
      { error: "Failed to fetch COT data" },
      { status: 500 }
    );
  }
}
