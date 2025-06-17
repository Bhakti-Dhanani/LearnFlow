// /pages/api/login.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { loginSchema } from "@/lib/validations/auth";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      JWT_SECRET: string; // Declare JWT_SECRET as a required string
    }
  }
}

export async function POST(request: Request) {
    try{
        const body = await request.json();
        console.log("Incoming request body:", body);

        const result = loginSchema.safeParse(body);

 
        if (!result.success) {
            return NextResponse.json({ 
                success: false, 
                errors: result.error.flatten().fieldErrors 
            });
        }

        const { email, password } = result.data;

        const user = await prisma.user.findUnique({
            where: { email },
            select: {
                userId: true, // Select id (mapped to userId)
                email: true,
                username: true,
                password: true,
                role: true,
            },
        });

        if (!user) {
            return NextResponse.json({ 
                success: false,
                message: "Invalid credentials" 
            });
        }

        if (!user.password) {
          return NextResponse.json({
            success: false,
            message: "Invalid credentials",
          });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return NextResponse.json({ 
                success: false,
                message: "Invalid credentials" 
            });
        }

        if (!process.env.JWT_SECRET) {
            throw new Error("JWT_SECRET is not defined in the environment variables.");
        }

        const token = jwt.sign({  
            userId: user.userId, // Changed from user.userId to user.id
            email: user.email,
            role: user.role
        },
            process.env.JWT_SECRET as string, // TypeScript assertion added
        {
            expiresIn: "1h",
        });

        return NextResponse.json({
            success: true,
            message: "Login successful",
            token,
            user: { 
                userId: user.userId, // Map id to userId in the response
                email: user.email, 
                username: user.username,
                role: user.role
            },
        });
    } catch (error) {
        console.error("Login Error:", error);
        return NextResponse.json({ 
            success: false,
            message: "Failed to Login" 
        });
    }
}