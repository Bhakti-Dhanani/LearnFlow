import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";
import jwt from "jsonwebtoken";

const secret = process.env.NEXTAUTH_SECRET || "default_secret";

interface TokenPayload {
  id: number;
  role: string;
  name?: string; // Added optional name property
}

export async function DELETE(req: NextRequest, context: { params: { id: string } }) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }

    const tokenString = authHeader.split(" ")[1];
    const token = jwt.verify(tokenString, secret) as TokenPayload;

    if (!token || !token.id) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }

    const { id } = await context.params;
    const courseId = parseInt(id, 10);
    if (isNaN(courseId)) {
      return NextResponse.json({ error: "Invalid course ID" }, { status: 400 });
    }

    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    await prisma.course.delete({ where: { id: courseId } });

    return NextResponse.json({ message: "Course deleted successfully." });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Unexpected error." }, { status: 500 });
  }
}

export async function GET(req: NextRequest, context: { params: { id: string } }) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }

    const tokenString = authHeader.split(" ")[1];
    const token = jwt.verify(tokenString, secret) as TokenPayload;

    if (!token || !token.id || !token.role) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }

    const { id } = await context.params;
    const courseId = parseInt(id, 10);

    if (isNaN(courseId)) {
      return NextResponse.json({ error: "Invalid course ID" }, { status: 400 });
    }

    const course = await prisma.course.findUnique({ where: { id: courseId } });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const user = await prisma.user.findUnique({ where: { id: course.instructorId } });

    return NextResponse.json({
      course,
      user: {
        id: user?.id || token.id,
        name: user?.name || "Unknown",
        role: token.role,
      },
    });
  } catch (error: any) {
    console.error("Error fetching course:", error);
    return NextResponse.json({ error: error.message || "Unexpected error." }, { status: 500 });
  }
}
