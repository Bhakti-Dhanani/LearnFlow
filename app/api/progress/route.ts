import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../lib/prisma";
import jwt from "jsonwebtoken";

const secret = process.env.NEXTAUTH_SECRET || "default_secret";

interface TokenPayload {
  id: number;
}

/** GET /api/progress */
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }

    const tokenString = authHeader.split(" ")[1];
    const token = jwt.verify(tokenString, secret) as TokenPayload;

    if (!token || typeof token !== "object" || !("id" in token)) {
      return NextResponse.json({ error: "Invalid token." }, { status: 401 });
    }

    const userId = token.id;
    const courseId = req.nextUrl.searchParams.get("courseId"); // Fixing the issue with URLSearchParams

    if (!courseId) {
      return NextResponse.json({ error: "Course ID is required." }, { status: 400 });
    }

    const progress = await prisma.progress.findFirst({
      where: { userId, courseId: parseInt(courseId, 10) },
    }); // Ensure the Prisma schema includes a 'progress' model

    if (!progress) {
      return NextResponse.json({ error: "No progress found for the user in this course." }, { status: 404 });
    }

    return NextResponse.json({
      message: "Progress fetched successfully",
      progress,
    });
  } catch (error: any) {
    console.error("Error fetching progress:", error);
    return NextResponse.json({ error: error.message || "Unexpected error." }, { status: 500 });
  }
}

/** POST /api/progress */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }

    const tokenString = authHeader.split(" ")[1];
    const token = jwt.verify(tokenString, secret) as TokenPayload;

    if (!token || typeof token !== "object" || !("id" in token)) {
      return NextResponse.json({ error: "Invalid token." }, { status: 401 });
    }

    const userId = token.id;
    const { courseId, completedLessons } = await req.json();

    if (!courseId || completedLessons === undefined) {
      return NextResponse.json({ error: "Course ID and completed lessons are required." }, { status: 400 });
    }

    const totalLessons = await prisma.lesson.count({
      where: {
        module: {
          course: {
            id: parseInt(courseId, 10),
          },
        },
      },
    }); // Fetch total lessons dynamically by traversing relationships

    const progressValue = Math.min((completedLessons / totalLessons) * 100, 100);

    const progress = await prisma.progress.upsert({
      where: { userId_courseId: { userId, courseId } },
      update: { progress: progressValue },
      create: { userId, courseId, progress: progressValue },
    }); // Ensure the Prisma schema includes a 'progress' model

    if (progressValue === 100) {
      // Generate certificate with username
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true },
      });

      if (!user) {
        throw new Error("User not found");
      }

      await prisma.certificate.create({
        data: {
          userId,
          courseId,
          issuedAt: new Date(),
          // Removed userName field
        },
      });
    }

    return NextResponse.json({
      message: "Progress updated successfully",
      progress,
    });
  } catch (error: any) {
    console.error("Error updating progress:", error);
    return NextResponse.json({ error: error.message || "Unexpected error." }, { status: 500 });
  }
}
