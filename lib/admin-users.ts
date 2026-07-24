import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";
import { getRoleOptions } from "@/lib/admin-roles";
import { getDb } from "@/lib/mongodb";
import { assertPasswordStrength } from "@/lib/password-policy";
import { deleteR2Objects } from "@/lib/r2-cleanup";
import {
  andFilters,
  buildSort,
  paginate,
  textSearchFilter,
  type ListQuery,
  type PaginatedResult,
} from "@/lib/list-query";

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
  profileImage: string | null;
};

export type UserFormValues = {
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  password?: string;
  roleId: string;
  status: "ACTIVE" | "INACTIVE" | "BLOCKED";
  profileImage?: string;
};

function toObjectId(id: string) {
  if (!ObjectId.isValid(id)) {
    throw new Error("Invalid user id.");
  }

  return new ObjectId(id);
}

const USER_SEARCH_FIELDS = ["firstName", "lastName", "email", "mobile"];
const USER_SORT_FIELDS = ["createdAt", "firstName", "email", "status"] as const;

function mapUser(user: Record<string, unknown>): UserListItem {
  const role = user.roleDoc as { name?: unknown } | undefined;
  return {
    id: String(user._id),
    firstName: String(user.firstName ?? ""),
    lastName: String(user.lastName ?? ""),
    email: String(user.email ?? ""),
    mobile: String(user.mobile ?? ""),
    status: (user.status ?? "ACTIVE") as UserListItem["status"],
    roleName: String(role?.name ?? "Unassigned"),
    createdAt: user.createdAt
      ? new Date(user.createdAt as string).toISOString()
      : "",
    lastLogin: user.lastLogin
      ? new Date(user.lastLogin as string).toISOString()
      : null,
    profileImage: user.profileImage ? String(user.profileImage) : null,
  } satisfies UserListItem;
}

export async function getUsers(
  query?: ListQuery
): Promise<PaginatedResult<UserListItem>> {
  const db = await getDb();
  const q: ListQuery = query ?? {
    page: 1,
    pageSize: 20,
    skip: 0,
    limit: 20,
    search: "",
    sortField: "createdAt",
    sortDir: -1,
    status: "",
    from: "",
    to: "",
  };
  const filter = andFilters(
    textSearchFilter(q.search, USER_SEARCH_FIELDS),
    q.status ? { status: q.status } : undefined
  );
  const sort = buildSort(q.sortField, q.sortDir, USER_SORT_FIELDS, "createdAt");

  const [total, docs] = await Promise.all([
    db.collection("users").countDocuments(filter),
    db
      .collection("users")
      .aggregate([
        { $match: filter },
        {
          $lookup: {
            from: "roles",
            localField: "role",
            foreignField: "_id",
            as: "roleDoc",
          },
        },
        {
          $unwind: { path: "$roleDoc", preserveNullAndEmptyArrays: true },
        },
        { $sort: sort as Record<string, 1 | -1> },
        { $skip: q.skip },
        { $limit: q.limit },
      ])
      .toArray(),
  ]);

  return paginate(docs.map(mapUser), total, q);
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
    profileImage: user.profileImage ? String(user.profileImage) : undefined,
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
  assertPasswordStrength(input.password);

  const db = await getDb();
  const role = await getRoleDocument(input.roleId);
  const normalizedEmail = input.email.trim().toLowerCase();
  const existingUser = await db
    .collection("users")
    .findOne({ email: normalizedEmail });

  if (existingUser) {
    throw new Error("A user with this email already exists.");
  }

  const passwordHash = await bcrypt.hash(input.password, 12);
  const now = new Date();

  const result = await db.collection("users").insertOne({
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    email: normalizedEmail,
    mobile: input.mobile.trim(),
    password: passwordHash,
    role: new ObjectId(role._id),
    profileImage: input.profileImage?.trim() || null,
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
    profileImage: input.profileImage?.trim() || null,
    updatedAt: new Date(),
  };

  if (input.password?.trim()) {
    assertPasswordStrength(input.password);
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

export async function deleteUser(id: string) {
  const db = await getDb();
  const userId = toObjectId(id);
  const existing = await db.collection("users").findOne({ _id: userId });
  if (!existing) throw new Error("User not found.");

  // Best-effort cleanup: invalidate all live sessions for this user so the
  // deleted user cannot continue to hold an active JWT.
  await db.collection("sessions").deleteMany({ userId: String(userId) });
  await db.collection("users").deleteOne({ _id: userId });

  if (existing.profileImage) {
    await deleteR2Objects([existing.profileImage as string]);
  }

  return { id };
}
