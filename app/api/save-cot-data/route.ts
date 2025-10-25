import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Create data directory if it doesn't exist
    const dataDir = path.join(process.cwd(), "data");
    await mkdir(dataDir, { recursive: true });

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `cot-report-${timestamp}.json`;
    const filepath = path.join(dataDir, filename);

    // Write file
    await writeFile(filepath, JSON.stringify(data, null, 2), "utf-8");

    return NextResponse.json({
      success: true,
      filename,
      message: "Data saved successfully",
    });
  } catch (error) {
    console.error("Error saving COT data:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to save data",
      },
      { status: 500 }
    );
  }
}
