import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";

/** GET /api/lessons/module/:moduleId */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const moduleIdParam = searchParams.get("moduleId");

    if (!moduleIdParam) {
      console.error("Module ID parameter is missing in the URL.");
      return NextResponse.json({ error: "Module ID parameter is required." }, { status: 400 });
    }

    const moduleId = parseInt(moduleIdParam, 10);

    if (isNaN(moduleId)) {
      console.error("Invalid module ID provided:", moduleIdParam);
      return NextResponse.json({ error: "Invalid module ID." }, { status: 400 });
    }

    const lessons = await prisma.lesson.findMany({
      where: { moduleId },
    });

    if (!lessons || lessons.length === 0) {
      console.warn("No lessons found for module ID:", moduleId);
      return NextResponse.json({ error: "No lessons found for the specified module." }, { status: 404 });
    }

    console.log("Lessons fetched successfully for module ID:", moduleId, lessons);

    return NextResponse.json({
      message: "Lessons fetched successfully",
      lessons,
    });
  } catch (error: any) {
    console.error("Error fetching lessons for module:", error);
    return NextResponse.json({ error: error.message || "Unexpected error." }, { status: 500 });
  }
}
