// src/lib/api-response.ts
import { NextResponse } from "next/server";

// Format SUKSES standar
export function successResponse(data: any, message: string = "Success", status: number = 200) {
  return NextResponse.json(
    {
      success: true,
      message: message,
      data: data,
    },
    { status }
  );
}

// Format ERROR standar
export function errorResponse(message: string, status: number = 500, details: any = null) {
  return NextResponse.json(
    {
      success: false,
      message: message,
      error_details: details, // Opsional: untuk debugging
    },
    { status }
  );
}