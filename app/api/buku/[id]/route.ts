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

    const book = await prisma.book.findUnique({
      where: { id },
      include: { user: { select: { name: true } } }
    });

    if (!book) {
      return errorResponse("Buku tidak ditemukan", 404);
    }

    return successResponse(book, "Detail buku ditemukan");

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
    const existingBook = await prisma.book.findUnique({ where: { id } });
    if (!existingBook) return errorResponse("Buku tidak ditemukan", 404);

    // Ambil data update
    const body = await request.json();
    
    const updatedBook = await prisma.book.update({
      where: { id },
      data: {
        title: body.title,
        year: body.year ? Number(body.year) : undefined,
        description: body.description
      }
    });

    return successResponse(updatedBook, "Buku berhasil diupdate");

  } catch (error) {
    return errorResponse("Gagal update buku", 500, error);
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
    // Middleware meloloskan /api/books/*, jadi kita harus cegat di sini
    if (session.role !== "ADMIN") {
      return errorResponse("Forbidden: Hanya Admin yang boleh menghapus data!", 403);
    }

    // C. Cek Barang
    const existingBook = await prisma.book.findUnique({ where: { id } });
    if (!existingBook) return errorResponse("Buku tidak ditemukan", 404);

    // D. Hapus
    await prisma.book.delete({ where: { id } });

    return successResponse(null, "Buku berhasil dihapus permanen");

  } catch (error) {
    return errorResponse("Gagal menghapus data", 500, error);
  }
}