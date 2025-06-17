import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";
import jwt from "jsonwebtoken";

const secret = process.env.NEXTAUTH_SECRET || "default_secret";

interface TokenPayload {
  id: number;
  role: string;
}

export async function GET() {
  try {
    const modules = await prisma.module.findMany();
    return NextResponse.json(modules);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch modules" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }

    const tokenString = authHeader.split(" ")[1];
    const token = jwt.verify(tokenString, secret) as TokenPayload;

    if (!token || !token.id) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }

    const body = await request.json();
    const course = await prisma.course.findUnique({ where: { id: body.courseId } });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    if (course.instructorId !== token.id) {
      return NextResponse.json({ error: "Forbidden: Only the course creator can add modules." }, { status: 403 });
    }

    const module = await prisma.module.create({ data: body });
    return NextResponse.json(module);
  } catch (error) {
    console.error("Error creating module:", error);
    return NextResponse.json({ error: "Failed to create module" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    await prisma.module.delete({ where: { id } });
    return NextResponse.json({ message: "Module deleted" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete module" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: "Module ID is required" }, { status: 400 });
    }

    const updatedModule = await prisma.module.update({
      where: { id },
      data,
    });

    return NextResponse.json(updatedModule);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update module" }, { status: 500 });
  }
}
