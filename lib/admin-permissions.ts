import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";

export type PermissionOption = {
  id: string;
  code: string;
  module: string;
  action: string;
};

export type PermissionListItem = {
  id: string;
  module: string;
  action: string;
  code: string;
  description: string;
  isActive: boolean;
  createdAt: string;
};

export type PermissionFormValues = {
  module: string;
  action: string;
  code: string;
  description: string;
  isActive: boolean;
};

function toObjectId(id: string) {
  if (!ObjectId.isValid(id)) {
    throw new Error("Invalid permission id.");
  }

  return new ObjectId(id);
}

export async function getPermissionOptions() {
  const db = await getDb();
  const permissions = await db
    .collection("permissions")
    .find({ isActive: true })
    .sort({ module: 1, action: 1 })
    .toArray();

  return permissions.map(
    (permission) =>
      ({
        id: String(permission._id),
        code: String(permission.code ?? ""),
        module: String(permission.module ?? ""),
        action: String(permission.action ?? ""),
      }) satisfies PermissionOption
  );
}

export async function getPermissions() {
  const db = await getDb();
  const permissions = await db
    .collection("permissions")
    .find({})
    .sort({ module: 1, action: 1 })
    .toArray();

  return permissions.map(
    (permission) =>
      ({
        id: String(permission._id),
        module: String(permission.module ?? ""),
        action: String(permission.action ?? ""),
        code: String(permission.code ?? ""),
        description: String(permission.description ?? ""),
        isActive: Boolean(permission.isActive ?? true),
        createdAt: permission.createdAt
          ? new Date(permission.createdAt).toISOString()
          : "",
      }) satisfies PermissionListItem
  );
}

export async function getPermissionById(id: string) {
  const db = await getDb();
  const permission = await db
    .collection("permissions")
    .findOne({ _id: toObjectId(id) });

  if (!permission) {
    return null;
  }

  return {
    id: String(permission._id),
    module: String(permission.module ?? ""),
    action: String(permission.action ?? ""),
    code: String(permission.code ?? ""),
    description: String(permission.description ?? ""),
    isActive: Boolean(permission.isActive ?? true),
  };
}

export async function createPermission(input: PermissionFormValues) {
  const db = await getDb();
  const code = input.code.trim().toUpperCase();
  const existing = await db.collection("permissions").findOne({ code });

  if (existing) {
    throw new Error("A permission with this code already exists.");
  }

  const now = new Date();
  const result = await db.collection("permissions").insertOne({
    module: input.module.trim(),
    action: input.action.trim(),
    code,
    description: input.description.trim(),
    isActive: input.isActive,
    createdAt: now,
    updatedAt: now,
  });

  return { id: String(result.insertedId) };
}

export async function updatePermission(id: string, input: PermissionFormValues) {
  const db = await getDb();
  const permissionId = toObjectId(id);
  const existing = await db.collection("permissions").findOne({ _id: permissionId });

  if (!existing) {
    throw new Error("Permission not found.");
  }

  const code = input.code.trim().toUpperCase();
  const duplicate = await db.collection("permissions").findOne({
    code,
    _id: { $ne: permissionId },
  });

  if (duplicate) {
    throw new Error("A permission with this code already exists.");
  }

  await db.collection("permissions").updateOne(
    { _id: permissionId },
    {
      $set: {
        module: input.module.trim(),
        action: input.action.trim(),
        code,
        description: input.description.trim(),
        isActive: input.isActive,
        updatedAt: new Date(),
      },
    }
  );

  return { id };
}

export async function deletePermission(id: string) {
  const db = await getDb();
  const permissionId = toObjectId(id);
  const existing = await db.collection("permissions").findOne({ _id: permissionId });

  if (!existing) {
    throw new Error("Permission not found.");
  }

  const rolesUsingPermission = await db.collection("roles").countDocuments({
    permissions: permissionId,
  });

  if (rolesUsingPermission > 0) {
    throw new Error("This permission is assigned to one or more roles and cannot be deleted.");
  }

  await db.collection("permissions").deleteOne({ _id: permissionId });

  return { id };
}
