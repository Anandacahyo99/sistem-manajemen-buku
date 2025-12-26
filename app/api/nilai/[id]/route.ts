import { successResponse, errorResponse } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// Helper untuk mengambil ID dari params (Next.js 15)
async function getParamsId(params: Promise<{ id: string }>) {
  return parseInt((await params).id);
}

// 1. GET ITEM BY ID (User/Login Token Wajib)
export async function GET(
  request: Request, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = await getParamsId(params);
    const session = await getSession(request);
    if (!session) return errorResponse("Unauthorized", 401);

    const grade = await prisma.grade.findUnique({
      where: { id },
      include: { user: { select: { name: true } } }
    });

    if (!grade) {
      return errorResponse("Data tidak ditemukan", 404);
    }

    return successResponse(grade, "Detail data ditemukan");

  } catch (error) {
    return errorResponse("Server Error", 500, error);
  }
}

// 2. PUT / PATCH ITEM (User atau Admin Token Wajib)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = await getParamsId(params);
    const session = await getSession(request);
    if (!session) return errorResponse("Unauthorized", 401);

    // Cek dulu barangnya ada gak?
    const existinggrade = await prisma.grade.findUnique({ where: { id } });
    if (!existinggrade) return errorResponse("data tidak ditemukan", 404);

    // Ambil data update
    const body = await request.json();
    
    const updatedgrade = await prisma.grade.update({
      where: { id },
      data: {
        subject: body.subject,
        score: body.score,
        sks: body.sks ? Number(body.sks) : undefined,
        semester: body.semester ? Number(body.semester) : undefined
      }
    });

    return successResponse(updatedgrade, "Data berhasil diupdate");

  } catch (error) {
    return errorResponse("Gagal update data", 500, error);
  }
}

// 3. DELETE ITEM (Admin Only Token + Role Based Authorization)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = await getParamsId(params);
    
    // A. Cek Login
    const session = await getSession(request);
    if (!session) return errorResponse("Unauthorized", 401);

    // B. CEK ROLE (PROTEKSI ADMIN)
    // Middleware meloloskan /api/grades/*, jadi kita harus cegat di sini
    if (session.role !== "ADMIN") {
      return errorResponse("Forbidden: Hanya Admin yang boleh menghapus data!", 403);
    }

    // C. Cek Barang
    const existinggrade = await prisma.grade.findUnique({ where: { id } });
    if (!existinggrade) return errorResponse("Data tidak ditemukan", 404);

    // D. Hapus
    await prisma.grade.delete({ where: { id } });

    return successResponse(null, "Data berhasil dihapus permanen");

  } catch (error) {
    return errorResponse("Gagal menghapus data", 500, error);
  }
}