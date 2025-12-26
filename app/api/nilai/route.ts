import { successResponse, errorResponse } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth"; // Helper auth yang kita buat sebelumnya
import { NextResponse } from "next/server";

// 1. GET ALL ITEMS (User/Login Token Wajib)
export async function GET(request: Request) {
  // 1. Ambil Query Params dari URL (Contoh: ?page=1&limit=5)
  const { searchParams } = new URL(request.url);

  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");

  // Hitung berapa data yang harus dilewati (Skip)
  const skip = (page - 1) * limit;

  try {
    // 2. Ambil Data dengan Filter
    const grades = await prisma.grade.findMany({
      skip: skip, // Lewati X data awal
      take: limit, // Ambil Y data saja
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true } } },
    });

    // 3. Hitung Total Data (Untuk Info Metadata)
    const totalgrades = await prisma.grade.count();

    return NextResponse.json({
      success: true,
      data: grades,
      pagination: {
        total_items: totalgrades,
        total_pages: Math.ceil(totalgrades / limit),
        current_page: page,
        items_per_page: limit,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

// 2. POST CREATE ITEM (User/Login Token Wajib)
export async function POST(request: Request) {
  try {
    const session = await getSession(request);
    if (!session) return errorResponse("Unauthorized", 401);

    // Ambil input body
    const body = await request.json();
    const { subject, score, sks, semester } = body;

    // Validasi Input Sederhana
    // Cek apakah data penting sudah diisi semua?
    if (!subject || !score || !sks || !semester) {
      return errorResponse(
        "Subject, Score, SKS, dan Semester wajib diisi!",
        400
      );
    }

    // Create ke Database
    const newgrade = await prisma.grade.create({
      data: {
        subject,
        score,
        sks: Number(sks),
        semester: Number(semester),
        userId: session.id,
        // <-- PENTING: ID User diambil dari Token, bukan input user
      },
    });

    return successResponse(newgrade, "Data berhasil dibuat", 201);
  } catch (error) {
    return errorResponse("Data membuat buku", 500, error);
  }
}
