import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const secret = process.env.JWT_SECRET || "default_secret";
const prismaClient = new PrismaClient();

interface TokenPayload {
  userId: string;
  role: string;
}

/**  GET /api/courses  */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    const totalCourses = await prismaClient.course.count();
    const courses = await prismaClient.course.findMany({
      skip: (page - 1) * limit,
      take: limit,
    });

    return NextResponse.json({
      success: true,
      totalCourses,
      page,
      limit,
      courses,
    });
  } catch (error) {
    console.error("Error fetching courses:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch courses." }, { status: 500 });
  }
}

/**  POST /api/courses  */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, message: "Unauthenticated" }, { status: 401 });
    }

    const tokenString = authHeader.split(" ")[1];
    const token = jwt.verify(tokenString, secret) as TokenPayload;

    if (!token || !token.role || !token.userId) {
      return NextResponse.json({ success: false, message: "Unauthenticated" }, { status: 401 });
    }

    if (token.role !== "Instructor" && token.role !== "Admin") {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { title, description, thumbnail } = body;

    if (!title || !description || !thumbnail) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 });
    }

    const course = await prismaClient.course.create({
      data: {
        title,
        description,
        thumbnail,
        instructorId: token.userId,
      },
    });

    return NextResponse.json({ success: true, message: "Course created successfully", course });
  } catch (error) {
    console.error("Error creating course:", error);
    return NextResponse.json({ success: false, message: (error as Error).message || "Unexpected error." }, { status: 500 });
  }
}

/**  DELETE /api/courses/:id  */
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, message: "Unauthenticated" }, { status: 401 });
    }

    const tokenString = authHeader.split(" ")[1];
    const token = jwt.verify(tokenString, secret) as TokenPayload;

    if (!token || !token.userId) {
      return NextResponse.json({ success: false, message: "Unauthenticated" }, { status: 401 });
    }

    const courseId = params.id;

    const course = await prismaClient.course.findUnique({ where: { id: courseId } });

    if (!course) {
      return NextResponse.json({ success: false, message: "Course not found" }, { status: 404 });
    }

    await prismaClient.course.delete({ where: { id: courseId } });

    return NextResponse.json({ success: true, message: "Course deleted successfully." });
  } catch (error) {
    console.error("Error deleting course:", error);
    return NextResponse.json({ success: false, message: (error as Error).message || "Unexpected error." }, { status: 500 });
  }
}
