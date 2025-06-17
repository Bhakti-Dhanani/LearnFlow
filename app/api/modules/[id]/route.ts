import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";
import jwt from "jsonwebtoken";

const secret = process.env.NEXTAUTH_SECRET || "default_secret";

export async function DELETE(req: NextRequest, context: { params: { id: string } }) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }

    const tokenString = authHeader.split(" ")[1];
    const token = jwt.verify(tokenString, secret) as { id: number; role: string };

    if (!token || !token.id) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }

    const { id } = await context.params;
    const moduleId = parseInt(id, 10);

    if (isNaN(moduleId)) {
      return NextResponse.json({ error: "Invalid module ID" }, { status: 400 });
    }

    const module = await prisma.module.findUnique({ where: { id: moduleId } });

    if (!module) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 });
    }

    const course = await prisma.course.findUnique({ where: { id: module.courseId } });

    if (!course || course.instructorId !== token.id) {
      return NextResponse.json({ error: "Forbidden: Only the course creator can delete modules." }, { status: 403 });
    }

    await prisma.module.delete({ where: { id: moduleId } });

    return NextResponse.json({ message: "Module deleted successfully." });
  } catch (error: any) {
    console.error("Error deleting module:", error);
    return NextResponse.json({ error: error.message || "Unexpected error." }, { status: 500 });
  }
}
