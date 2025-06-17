import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { authMiddleware } from "@/lib/middleware/authMiddleware";

const prismaClient = new PrismaClient();

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
      status: 200,
      totalCourses,
      page,
      limit,
      courses,
    });
  } catch (error) {
    console.error("Error fetching courses:", error);
    return NextResponse.json({ success: false, status: 500, message: "Failed to fetch courses." }, { status: 500 });
  }
}

/**  POST /api/courses  */
export async function POST(req: NextRequest) {
  try {
    const user = await authMiddleware(req, ["INSTRUCTOR", "ADMIN"]);

    if ("status" in user) return user;

    const body = await req.json();
    console.log("Incoming request body:", body);

    const { title, description, thumbnail,price,published } = body;

    if (!title || !description || !thumbnail) {
      return NextResponse.json({ success: false, status: 400, message: "Missing required fields" }, { status: 400 });
    }

    const course = await prismaClient.course.create({
      data: {
        title,
        description,
        thumbnail,
        price,
        published,
        instructor: {
          connect: { userId: user.userId },
        },
      },
    });

    return NextResponse.json({ success: true, status: 201, message: "Course created successfully", course });
  } catch (error) {
    console.error("Error creating course:", error);
    return NextResponse.json({ success: false, status: 500, message: "Failed to create course." }, { status: 500 });
  }
}

/**  DELETE /api/courses/:id  */
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await authMiddleware(req, ["Instructor", "Admin"]);

    if ("status" in user) return user;

    const courseId = params.id;

    const course = await prismaClient.course.findUnique({ where: { id: courseId } });

    if (!course) {
      return NextResponse.json({ success: false, status: 404, message: "Course not found" }, { status: 404 });
    }

    await prismaClient.course.delete({ where: { id: courseId } });

    return NextResponse.json({ success: true, status: 200, message: "Course deleted successfully." });
  } catch (error) {
    console.error("Error deleting course:", error);
    return NextResponse.json({ success: false, status: 500, message: "Failed to delete course." }, { status: 500 });
  }
}
