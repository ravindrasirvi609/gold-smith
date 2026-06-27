import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";
import { getRoleOptions } from "@/lib/admin-roles";
import { getDb } from "@/lib/mongodb";

export type { RoleOption } from "@/lib/admin-roles";
export { getRoleOptions };

export type UserListItem = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  status: "ACTIVE" | "INACTIVE" | "BLOCKED";
  roleName: string;
  createdAt: string;
  lastLogin: string | null;
};

export type UserFormValues = {
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  password?: string;
  roleId: string;
  status: "ACTIVE" | "INACTIVE" | "BLOCKED";
};

function toObjectId(id: string) {
  if (!ObjectId.isValid(id)) {
    throw new Error("Invalid user id.");
  }

  return new ObjectId(id);
}

export async function getUsers() {
  const db = await getDb();
  const users = await db
    .collection("users")
    .aggregate([
      {
        $lookup: {
          from: "roles",
          localField: "role",
          foreignField: "_id",
          as: "roleDoc",
        },
      },
      {
        $unwind: {
          path: "$roleDoc",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $sort: { createdAt: -1 },
      },
    ])
    .toArray();

  return users.map(
    (user) =>
      ({
        id: String(user._id),
        firstName: String(user.firstName ?? ""),
        lastName: String(user.lastName ?? ""),
        email: String(user.email ?? ""),
        mobile: String(user.mobile ?? ""),
        status: (user.status ?? "ACTIVE") as UserListItem["status"],
        roleName: String(user.roleDoc?.name ?? "Unassigned"),
        createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : "",
        lastLogin: user.lastLogin ? new Date(user.lastLogin).toISOString() : null,
      }) satisfies UserListItem
  );
}

export async function getUserById(id: string) {
  const db = await getDb();
  const user = await db.collection("users").findOne({ _id: toObjectId(id) });

  if (!user) {
    return null;
  }

  return {
    id: String(user._id),
    firstName: String(user.firstName ?? ""),
    lastName: String(user.lastName ?? ""),
    email: String(user.email ?? ""),
    mobile: String(user.mobile ?? ""),
    roleId: String(user.role ?? ""),
    status: (user.status ?? "ACTIVE") as UserFormValues["status"],
  };
}

async function getRoleDocument(roleId: string) {
  const db = await getDb();

  if (!ObjectId.isValid(roleId)) {
    throw new Error("Please select a valid role.");
  }

  const role = await db.collection("roles").findOne({
    _id: new ObjectId(roleId),
    isActive: true,
  });

  if (!role) {
    throw new Error("Selected role does not exist.");
  }

  return role;
}

export async function createUser(input: UserFormValues, createdBy?: string) {
  if (!input.password) {
    throw new Error("Password is required.");
  }

  const db = await getDb();
  const role = await getRoleDocument(input.roleId);
  const existingUser = await db.collection("users").findOne({ email: input.email });

  if (existingUser) {
    throw new Error("A user with this email already exists.");
  }

  const passwordHash = await bcrypt.hash(input.password, 12);
  const now = new Date();

  const result = await db.collection("users").insertOne({
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    email: input.email.trim().toLowerCase(),
    mobile: input.mobile.trim(),
    password: passwordHash,
    role: new ObjectId(role._id),
    profileImage: null,
    status: input.status,
    lastLogin: null,
    createdBy: createdBy ? new ObjectId(createdBy) : null,
    createdAt: now,
    updatedAt: now,
  });

  return { id: String(result.insertedId) };
}

export async function updateUser(id: string, input: UserFormValues) {
  const db = await getDb();
  const role = await getRoleDocument(input.roleId);
  const userId = toObjectId(id);
  const existingUser = await db.collection("users").findOne({ _id: userId });

  if (!existingUser) {
    throw new Error("User not found.");
  }

  const update: Record<string, unknown> = {
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    email: input.email.trim().toLowerCase(),
    mobile: input.mobile.trim(),
    role: new ObjectId(role._id),
    status: input.status,
    updatedAt: new Date(),
  };

  if (input.password?.trim()) {
    update.password = await bcrypt.hash(input.password, 12);
  }

  await db.collection("users").updateOne(
    { _id: userId },
    {
      $set: update,
    }
  );

  return { id };
}
