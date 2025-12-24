// src/app/api/auth/register/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // Pastikan path ini sesuai file prisma.ts Anda
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    // 1. Ambil data dari body
    const { name, email, password } = await request.json();

    // 2. Validasi sederhana
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email dan Password wajib diisi!" },
        { status: 400 }
      );
    }

    // 3. Cek apakah email sudah terdaftar?
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email sudah terdaftar!" },
        { status: 400 }
      );
    }

    // 4. HASH PASSWORD (Enkripsi)
    // Angka 10 adalah "cost factor" (semakin tinggi semakin aman tapi lambat)
    const hashedPassword = await bcrypt.hash(password, 10);

    // 5. Simpan ke Database
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        // Role tidak perlu diisi, otomatis jadi USER sesuai default schema
      },
    });

    // 6. Balas sukses (Jangan kirim balik passwordnya!)
    return NextResponse.json(
      { 
        message: "Register Berhasil!", 
        data: { id: newUser.id, email: newUser.email, role: newUser.role } 
      }, 
      { status: 201 }
    );

  } catch (error) {
    return NextResponse.json(
      { error: "Gagal Register User" },
      { status: 500 }
    );
  }
}