import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../lib/prisma";
import jwt from "jsonwebtoken";

const secret = process.env.NEXTAUTH_SECRET || "default_secret";

interface TokenPayload {
  id: number; // Changed id type to number
  role: string;
}

/**  GET /api/courses  */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    const totalCourses = await prisma.course.count();
    const courses = await prisma.course.findMany({
      skip: (page - 1) * limit,
      take: limit,
    });

    return NextResponse.json({
      totalCourses,
      page,
      limit,
      courses,
    });
  } catch (error: any) {
    console.error("Error fetching courses:", error);
    return NextResponse.json({ error: "Failed to fetch courses." }, { status: 500 });
  }
}

/**  POST /api/courses  */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.error("Authorization header is missing or invalid.");
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }

    const tokenString = authHeader.split(" ")[1];
    const token = jwt.verify(tokenString, secret) as TokenPayload;

    if (!token || !token.role || !token.id) {
      console.error("Token is missing or invalid.");
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }

    if (token.role !== "Instructor" && token.role !== "Admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { title, description, thumbnail } = await req.json();

    if (!title || !description || !thumbnail) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const course = await prisma.course.create({
      data: {
        title,
        description,
        thumbnail,
        instructorId: token.id, // Pass instructorId as an integer
      },
    });

    return NextResponse.json(
      {
        message: "Course created successfully",
        course,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error creating course:", error);
    return NextResponse.json({ error: error.message || "Unexpected error." }, { status: 500 });
  }
}

/**  DELETE /api/courses/:id  */
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.error("Authorization header is missing or invalid.");
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }

    const tokenString = authHeader.split(" ")[1];
    const token = jwt.verify(tokenString, secret) as TokenPayload;

    if (!token || !token.id) {
      console.error("Token is missing or invalid.");
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }

    const courseId = parseInt(params.id, 10);

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
    console.error("Error deleting course:", error);
    return NextResponse.json({ error: error.message || "Unexpected error." }, { status: 500 });
  }
}
