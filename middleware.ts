// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

// RATE LIMITER SEDERHANA (In-Memory Map)
// Peringatan: Di Vercel (Serverless), Map ini akan reset setiap kali function sleep.
// Untuk produksi serius, gunakan Redis (Upstash). Tapi untuk tugas, ini CUKUP.
const rateLimitMap = new Map();

export async function middleware(request: NextRequest) {
    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
  const path = request.nextUrl.pathname;
  
  // -----------------------------------------------------
  // 1. LOGGING (Catat Request Masuk)
  // -----------------------------------------------------
  console.log(`[LOG] ${new Date().toISOString()} | ${request.method} ${path} | IP: ${ip}`);

  // -----------------------------------------------------
  // 2. RATE LIMITING (Batasi 10 request per 10 detik)
  // -----------------------------------------------------
  const limit = 10; // Maksimal request
  const windowMs = 10 * 1000; // Dalam waktu 10 detik

  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, { count: 1, lastReset: Date.now() });
  } else {
    const data = rateLimitMap.get(ip);
    
    // Reset jika waktu jendela sudah lewat
    if (Date.now() - data.lastReset > windowMs) {
      data.count = 1;
      data.lastReset = Date.now();
    } else {
      data.count++;
      
      // BLOKIR JIKA MELEBIHI BATAS
      if (data.count > limit) {
        return NextResponse.json(
          { error: "Too Many Requests (Rate Limit Exceeded). Santai dulu bang." }, 
          { status: 429 }
        );
      }
    }
  }

  // -----------------------------------------------------
  // 3. LOGIKA AUTH & ROLE (Seperti kode sebelumnya)
  // -----------------------------------------------------
  if (path.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Token Missing" }, { status: 401 });
  }

  const token = authHeader.split(" ")[1];

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const role = payload.role as string;

    if (path.startsWith("/api/users") && role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin Only" }, { status: 403 });
    }

    return NextResponse.next();
  } catch (error) {
    return NextResponse.json({ error: "Invalid Token" }, { status: 401 });
  }
}

export const config = {
  matcher: "/api/:path*",
};