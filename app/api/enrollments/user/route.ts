import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";
import jwt from "jsonwebtoken";

const secret = process.env.NEXTAUTH_SECRET || "default_secret";

interface TokenPayload {
  id: number;
}

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
  } catch (error: any) {
    console.error("Error fetching enrollments for user:", error);
    return NextResponse.json({ error: error.message || "Unexpected error." }, { status: 500 });
  }
}
