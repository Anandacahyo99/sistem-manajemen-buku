// src/lib/auth.ts
import jwt from "jsonwebtoken";

export async function getSession(request: Request) {
  // 1. Ambil header Authorization (Isinya: "Bearer eyJhbGci...")
  const authHeader = request.headers.get("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null; // Tidak ada tiket
  }

  // 2. Ambil tokennya saja (buang tulisan "Bearer ")
  const token = authHeader.split(" ")[1];

  try {
    // 3. Verifikasi tanda tangan token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    return decoded as { id: number; email: string; role: string };
  } catch (error) {
    return null; // Token palsu/expired
  }
}