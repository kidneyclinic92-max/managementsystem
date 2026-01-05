import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createAuthToken, type UserRole } from "@/lib/auth";
import { createUserDb } from "@/lib/auth-db";

const REQUIRED_FIELDS = ["username", "email", "password", "fullName"];

export async function POST(request: Request) {
  const body = await request.json();

  for (const field of REQUIRED_FIELDS) {
    if (!body[field] || typeof body[field] !== "string" || !body[field].trim()) {
      return NextResponse.json(
        { message: `Field '${field}' is required` },
        { status: 400 }
      );
    }
  }

  const {
    username,
    email,
    password,
    fullName,
    companyName,
    phone,
    address,
  } = body;

  if (password.length < 8) {
    return NextResponse.json(
      { message: "Password must be at least 8 characters" },
      { status: 400 }
    );
  }

  try {
    const user = await createUserDb({
      username: username.trim(),
      email: email.trim().toLowerCase(),
      password,
      fullName: fullName.trim(),
      companyName: companyName?.trim(),
      phone: phone?.trim(),
      address: address?.trim(),
      role: "vendor" as UserRole,
    });

    const token = await createAuthToken(user);

    const cookieStore = await cookies();
    cookieStore.set("auth_token", token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24,
    });

    return NextResponse.json({
      user,
      token,
    });
  } catch (err: any) {
    const message = err.message || "Registration failed";
    const status =
      message.includes("already exists") || message.includes("duplicate")
        ? 409
        : 500;
    return NextResponse.json(
      { message },
      { status }
    );
  }
}

