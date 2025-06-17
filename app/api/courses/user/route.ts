import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";
import jwt from "jsonwebtoken";

const secret = process.env.NEXTAUTH_SECRET || "default_secret";

interface TokenPayload {
  id: number;
  role: string;
}

export async function GET(req: NextRequest) {
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

    const user = await prisma.user.findUnique({ where: { id: token.id } });

    const courses = await prisma.course.findMany({ where: { instructorId: token.id } });

    if (courses.length === 0) {
      return NextResponse.json({ error: "No courses found for this user." }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: user?.id || token.id,
        name: user?.name || "Unknown",
        role: token.role,
      },
      courses,
    });
  } catch (error: any) {
    console.error("Error fetching courses by user:", error);
    return NextResponse.json({ error: error.message || "Unexpected error." }, { status: 500 });
  }
}
