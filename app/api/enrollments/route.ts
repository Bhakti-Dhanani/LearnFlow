import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../lib/prisma";
import jwt from "jsonwebtoken";

const secret = process.env.NEXTAUTH_SECRET || "default_secret";

interface TokenPayload {
  id: number;
  role: string;
}

/** POST /api/enrollments */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }

    const tokenString = authHeader.split(" ")[1];
    const token = jwt.verify(tokenString, secret) as TokenPayload;

    if (!token || token.role !== "Student") {
      return NextResponse.json({ error: "Only students can enroll in courses." }, { status: 403 });
    }

    const { courseId } = await req.json();

    if (!courseId) {
      return NextResponse.json({ error: "Course ID is required." }, { status: 400 });
    }

    // Check if the user is already enrolled in the course
    const existingEnrollment = await prisma.enrollment.findFirst({
      where: {
        userId: token.id,
        courseId,
      },
    });

    if (existingEnrollment) {
      return NextResponse.json({ error: "User is already enrolled in this course." }, { status: 400 });
    }

    // Create the enrollment
    const enrollment = await prisma.enrollment.create({
      data: {
        userId: token.id,
        courseId,
      },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: "Enrollment successful",
      enrollment: {
        ...enrollment,
        userName: enrollment.user.name,
      },
    });
  } catch (error: any) {
    console.error("Error enrolling in course:", error);
    return NextResponse.json({ error: error.message || "Unexpected error." }, { status: 500 });
  }
}

/** GET /api/enrollments */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const pathSegments = url.pathname.split("/");
    const isUserRoute = pathSegments.includes("user");

    console.log("Request URL:", req.url);
    console.log("Path Segments:", pathSegments);
    console.log("Is User Route:", isUserRoute);

    if (isUserRoute) {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
      }

      const tokenString = authHeader.split(" ")[1];
      const token = jwt.verify(tokenString, secret);

      if (!token || typeof token !== "object" || !("id" in token)) {
        return NextResponse.json({ error: "Invalid token." }, { status: 401 });
      }

      const userId = token.id;

      const enrollments = await prisma.enrollment.findMany({
        where: { userId },
        include: { course: true },
      });

      if (!enrollments || enrollments.length === 0) {
        return NextResponse.json({ error: "No enrollments found for the user." }, { status: 404 });
      }

      return NextResponse.json({
        message: "Enrollments fetched successfully",
        enrollments,
      });
    }

    // Handle other GET requests
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }

    const tokenString = authHeader.split(" ")[1];
    const token = jwt.verify(tokenString, secret) as TokenPayload;

    if (!token) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }

    // Fetch enrollments for the authenticated user
    const enrollments = await prisma.enrollment.findMany({
      where: {
        userId: token.id,
      },
      include: {
        course: true,
      },
    });

    return NextResponse.json({
      message: "Enrollments fetched successfully",
      enrollments,
    });
  } catch (error: any) {
    console.error("Error fetching enrollments:", error);
    return NextResponse.json({ error: error.message || "Unexpected error." }, { status: 500 });
  }
}

/** DELETE /api/enrollments/:id */
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }

    const tokenString = authHeader.split(" ")[1];
    const token = jwt.verify(tokenString, secret) as TokenPayload;

    if (!token) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }

    const enrollmentId = parseInt(params.id, 10);

    if (isNaN(enrollmentId)) {
      return NextResponse.json({ error: "Invalid enrollment ID" }, { status: 400 });
    }

    // Check if the enrollment exists and belongs to the user
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
    });

    if (!enrollment || enrollment.userId !== token.id) {
      return NextResponse.json({ error: "Enrollment not found or access denied." }, { status: 404 });
    }

    // Delete the enrollment
    await prisma.enrollment.delete({
      where: { id: enrollmentId },
    });

    return NextResponse.json({ message: "Enrollment deleted successfully." });
  } catch (error: any) {
    console.error("Error deleting enrollment:", error);
    return NextResponse.json({ error: error.message || "Unexpected error." }, { status: 500 });
  }
}
