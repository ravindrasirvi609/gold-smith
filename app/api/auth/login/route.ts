import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { authCookieName, createSessionRecord, normalizeEmail } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { rateLimit } from "@/lib/rate-limit";
import {
  clearFailedLogins,
  isAccountLocked,
  recordFailedLogin,
} from "@/lib/account-lockout";
import {
  getClientIp,
  getUserAgent,
  logSecurityEvent,
} from "@/lib/security-events";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const userAgent = getUserAgent(request);

  try {
    const formData = await request.formData();
    const emailValue = String(formData.get("email") ?? "").trim();
    const passwordValue = String(formData.get("password") ?? "");

    if (!emailValue || !passwordValue) {
      return NextResponse.json(
        { ok: false, message: "Email and password are required." },
        { status: 400 }
      );
    }

    const email = normalizeEmail(emailValue);

    // Rate limit: 10 attempts per 15 minutes per IP address.
    const ipLimit = await rateLimit({
      key: `login:ip:${ip}`,
      limit: 10,
      windowSeconds: 15 * 60,
    });
    // Rate limit: 5 attempts per 15 minutes per email.
    const emailLimit = await rateLimit({
      key: `login:email:${email}`,
      limit: 5,
      windowSeconds: 15 * 60,
    });

    if (!ipLimit.allowed || !emailLimit.allowed) {
      await logSecurityEvent({
        type: "RATE_LIMITED",
        email,
        ip,
        userAgent,
        path: "/api/auth/login",
      });
      const retryAfterMs =
        Math.max(
          ipLimit.resetAt.getTime(),
          emailLimit.resetAt.getTime()
        ) - Date.now();
      return NextResponse.json(
        {
          ok: false,
          message: "Too many login attempts. Please try again later.",
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.max(1, Math.ceil(retryAfterMs / 1000))),
          },
        }
      );
    }

    // Account lockout check (only meaningful if the email exists).
    const lockStatus = await isAccountLocked(email);
    if (lockStatus.locked) {
      await logSecurityEvent({
        type: "LOGIN_LOCKED",
        email,
        ip,
        userAgent,
        path: "/api/auth/login",
        metadata: { unlocksAt: lockStatus.unlocksAt.toISOString() },
      });
      return NextResponse.json(
        {
          ok: false,
          message:
            "This account is temporarily locked due to repeated failed logins. Try again later.",
        },
        { status: 423 }
      );
    }

    const db = await getDb();

    const user = await db.collection("users").findOne({ email });

    if (!user) {
      await recordFailedLogin(email);
      await logSecurityEvent({
        type: "LOGIN_FAILED",
        email,
        ip,
        userAgent,
        path: "/api/auth/login",
        metadata: { reason: "USER_NOT_FOUND" },
      });
      return NextResponse.json(
        { ok: false, message: "Invalid email or password." },
        { status: 401 }
      );
    }

    if (user.status !== "ACTIVE") {
      await logSecurityEvent({
        type: "LOGIN_FAILED",
        email,
        userId: String(user._id),
        ip,
        userAgent,
        path: "/api/auth/login",
        metadata: { reason: "INACTIVE" },
      });
      return NextResponse.json(
        { ok: false, message: "This account is inactive or blocked." },
        { status: 403 }
      );
    }

    const passwordMatches = await bcrypt.compare(
      passwordValue,
      String(user.password)
    );

    if (!passwordMatches) {
      await recordFailedLogin(email);
      await logSecurityEvent({
        type: "LOGIN_FAILED",
        email,
        userId: String(user._id),
        ip,
        userAgent,
        path: "/api/auth/login",
        metadata: { reason: "BAD_PASSWORD" },
      });
      return NextResponse.json(
        { ok: false, message: "Invalid email or password." },
        { status: 401 }
      );
    }

    const role = await db.collection("roles").findOne({ _id: user.role });

    if (!role || role.isActive === false) {
      await logSecurityEvent({
        type: "LOGIN_FAILED",
        email,
        userId: String(user._id),
        ip,
        userAgent,
        path: "/api/auth/login",
        metadata: { reason: "INACTIVE_ROLE" },
      });
      return NextResponse.json(
        { ok: false, message: "Your role is not active." },
        { status: 403 }
      );
    }

    const permissionIds = Array.isArray(role.permissions) ? role.permissions : [];
    const permissions = permissionIds.length
      ? await db
          .collection("permissions")
          .find({ _id: { $in: permissionIds }, isActive: true })
          .toArray()
      : [];

    const session = await createSessionRecord({
      userId: String(user._id),
      email: user.email,
      firstName: user.firstName ?? "",
      lastName: user.lastName ?? "",
      role: {
        id: String(role._id),
        name: String(role.name),
      },
      permissions: permissions.map((permission) => String(permission.code)),
    });

    const response = NextResponse.json({ ok: true });
    response.cookies.set(authCookieName, session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    await Promise.all([
      db.collection("users").updateOne(
        { _id: user._id },
        { $set: { lastLogin: new Date() } }
      ),
      clearFailedLogins(email),
      logSecurityEvent({
        type: "LOGIN_SUCCESS",
        email,
        userId: String(user._id),
        ip,
        userAgent,
        path: "/api/auth/login",
      }),
    ]);

    return response;
  } catch (error) {
    console.error("[login] unexpected error", error);
    return NextResponse.json(
      { ok: false, message: "Login failed. Please try again." },
      { status: 500 }
    );
  }
}
