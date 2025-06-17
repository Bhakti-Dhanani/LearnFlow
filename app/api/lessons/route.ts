import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../lib/prisma";
import jwt from "jsonwebtoken";

const secret = process.env.NEXTAUTH_SECRET || "default_secret";

interface TokenPayload {
  id: number;
  role: string;
}

export async function GET() {
  try {
    const lessons = await prisma.lesson.findMany();
    return NextResponse.json(lessons);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch lessons" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }

    const tokenString = authHeader.split(" ")[1];
    const token = jwt.verify(tokenString, secret) as TokenPayload;

    if (!token || !token.id || token.role !== "Instructor") {
      return NextResponse.json({ error: "Forbidden: Only instructors can add lessons." }, { status: 403 });
    }

    const body = await req.json();
    const { title, moduleId, contentType, contentData } = body;

    if (!title || !moduleId || !contentType || !contentData) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Validate duration format (hh:mm:ss)
    const durationRegex = /^\d{2}:\d{2}:\d{2}$/;
    if (!durationRegex.test(contentData.duration)) {
      return NextResponse.json({ error: "Invalid duration format. Use hh:mm:ss." }, { status: 400 });
    }

    const module = await prisma.module.findUnique({ where: { id: moduleId } });

    if (!module) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 });
    }

    const formattedDuration = contentData.duration; // Use duration as provided without conversion

    console.log("Formatted Duration:", formattedDuration); // Debugging log

    let lesson;
    try {
      lesson = await prisma.lesson.create({
        data: {
          title,
          module: { connect: { id: moduleId } },
          duration: formattedDuration, // Store duration as provided
        },
      });
    } catch (error: any) {
      console.error("Error during lesson creation:", {
        title,
        moduleId,
        duration: formattedDuration,
        error: error.message,
      });
      throw error; // Re-throw the error after logging for debugging
    }

    switch (contentType) {
      case "Video":
        await prisma.video.create({
          data: {
            url: contentData.url,
            lesson: { connect: { id: lesson.id } },
          },
        });
        break;
      case "PDF":
        await prisma.pDF.create({
          data: {
            url: contentData.url,
            lesson: { connect: { id: lesson.id } },
          },
        });
        break;
      case "Document":
        await prisma.document.create({
          data: {
            url: contentData.url,
            lesson: { connect: { id: lesson.id } },
          },
        });
        break;
      case "Quiz":
        await prisma.quiz.create({
          data: {
            questions: contentData.questions,
            lesson: { connect: { id: lesson.id } },
          },
        });
        break;
      default:
        return NextResponse.json({ error: "Invalid content type" }, { status: 400 });
    }

    return NextResponse.json({ message: "Lesson created successfully", lesson });
  } catch (error: any) {
    console.error("Error creating lesson:", error);
    return NextResponse.json({ error: error.message || "Unexpected error." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    await prisma.lesson.delete({ where: { id } });
    return NextResponse.json({ message: "Lesson deleted" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete lesson" }, { status: 500 });
  }
}
