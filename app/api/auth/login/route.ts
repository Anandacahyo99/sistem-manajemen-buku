// src/app/api/auth/login/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    // 1. Cari user berdasarkan email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Email atau Password salah!" },
        { status: 401 }
      );
    }

    // 2. Cek Password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Email atau Password salah!" },
        { status: 401 }
      );
    }

    // 3. SIAPKAN PAYLOAD (Dibuat dulu sebelum dipakai)
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    // 4. GENERATE 2 JENIS TOKEN
    // Access Token: Umur pendek (15 menit) untuk akses API
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: "15m" });
    
    // Refresh Token: Umur panjang (7 hari) untuk login ulang otomatis
    const refreshToken = jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: "7d" });

    // 5. SIMPAN REFRESH TOKEN KE DATABASE (Update User)
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: refreshToken }
    });

    // 6. KIRIM RESPONSE
    return NextResponse.json({
      message: "Login Berhasil!",
      accessToken, 
      refreshToken, 
      user: payload
    });

  } catch (error) {
    console.error("Login Error:", error); // Tambah log biar gampang debug
    return NextResponse.json(
      { error: "Gagal Login" },
      { status: 500 }
    );
  }
}