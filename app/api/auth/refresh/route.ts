// src/app/api/auth/refresh/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

export async function POST(request: Request) {
  try {
    const { refreshToken } = await request.json();

    if (!refreshToken) return NextResponse.json({ error: "Refresh Token Wajib" }, { status: 401 });

    // 1. Cek apakah token ada di Database? (Agar bisa dilacak/revoked)
    const user = await prisma.user.findFirst({
      where: { refreshToken },
    });

    if (!user) return NextResponse.json({ error: "Refresh Token Invalid / Expired" }, { status: 403 });

    // 2. Verifikasi Signature Token
    jwt.verify(refreshToken, process.env.JWT_SECRET!);

    // 3. Bikin Access Token BARU
    const payload = { id: user.id, email: user.email, role: user.role };
    const newAccessToken = jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: "15m" });

    return NextResponse.json({ accessToken: newAccessToken });

  } catch (error) {
    return NextResponse.json({ error: "Gagal refresh token" }, { status: 403 });
  }
}