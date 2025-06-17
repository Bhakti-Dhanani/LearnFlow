"use server";
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { authMiddleware } from "@/lib/middleware/authMiddleware";

const prismaClient = new PrismaClient();

/**  GET /api/courses/user  */
export async function GET(req: NextRequest) {
  try {
    const authResult = await authMiddleware(req, ["INSTRUCTOR", "ADMIN"]);

    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: authResult.message }, { status: 401 });
    }

    const { userId } = authResult.user;

    const courses = await prismaClient.course.findMany({
      where: { instructorId: userId },
    });

    if (courses.length === 0) {
      return NextResponse.json({ error: "No courses found for this user." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: {
        userId,
        role: authResult.user.role,
      },
      courses,
    });
  } catch (error: any) {
    console.error("Error fetching courses by user:", error);
    return NextResponse.json({ error: error.message || "Unexpected error." }, { status: 500 });
  }
}