import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const courseId = parseInt(searchParams.get("courseId") || "0", 10);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = 5; // Show 5 modules per page

    if (isNaN(courseId) || courseId <= 0) {
      return NextResponse.json({ error: "Invalid course ID" }, { status: 400 });
    }

    const totalModules = await prisma.module.count({ where: { courseId } });
    const modules = await prisma.module.findMany({
      where: { courseId },
      skip: (page - 1) * limit,
      take: limit,
    });

    if (modules.length === 0) {
      return NextResponse.json({ error: "No modules found for this course." }, { status: 404 });
    }

    return NextResponse.json({
      totalModules,
      page,
      limit,
      modules,
    });
  } catch (error: any) {
    console.error("Error fetching modules by course:", error);
    return NextResponse.json({ error: error.message || "Unexpected error." }, { status: 500 });
  }
}
