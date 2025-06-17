// lib/middleware/authMiddleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';


export async function authMiddleware(
  req: NextRequest,
  allowedRoles: string[] = []
): Promise<{ success: boolean; message: string; user?: { userId: string; role: string } }> {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return { success: false, message: "Authorization header is missing or invalid" };
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);

    if (!decoded || !decoded.userId || !decoded.role) {
      return { success: false, message: "Invalid or expired token" };
    }

    if (!allowedRoles.includes(decoded.role)) {
      return { success: false, message: "Forbidden: User role not allowed" };
    }

    return { success: true, message: "Authorized", user: { userId: decoded.userId, role: decoded.role } };
  } catch (error) {
    console.error("Error in authMiddleware:", error);
    return { success: false, message: "Unexpected error during authorization" };
  }
}