import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { authCookieName, createSessionRecord, normalizeEmail } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";

export async function POST(request: Request) {
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
    const db = await getDb();

    const user = await db.collection("users").findOne({ email });

    if (!user) {
      return NextResponse.json(
        { ok: false, message: "Invalid email or password." },
        { status: 401 }
      );
    }

    if (user.status !== "ACTIVE") {
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
      return NextResponse.json(
        { ok: false, message: "Invalid email or password." },
        { status: 401 }
      );
    }

    const role = await db.collection("roles").findOne({ _id: user.role });

    if (!role || role.isActive === false) {
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

    await db.collection("users").updateOne(
      { _id: user._id },
      {
        $set: {
          lastLogin: new Date(),
        },
      }
    );

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Login failed.";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
