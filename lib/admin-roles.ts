import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";

export type RoleOption = {
  id: string;
  name: string;
};

export type RoleListItem = {
  id: string;
  name: string;
  description: string;
  permissionCount: number;
  isSystem: boolean;
  isActive: boolean;
  createdAt: string;
};

export type RoleFormValues = {
  name: string;
  description: string;
  permissionIds: string[];
  isActive: boolean;
};

function toObjectId(id: string) {
  if (!ObjectId.isValid(id)) {
    throw new Error("Invalid role id.");
  }

  return new ObjectId(id);
}

export async function getRoleOptions() {
  const db = await getDb();
  const roles = await db
    .collection("roles")
    .find({ isActive: true })
    .sort({ name: 1 })
    .toArray();

  return roles.map(
    (role) =>
      ({
        id: String(role._id),
        name: String(role.name),
      }) satisfies RoleOption
  );
}

export async function getRoles() {
  const db = await getDb();
  const roles = await db
    .collection("roles")
    .find({})
    .sort({ name: 1 })
    .toArray();

  return roles.map(
    (role) =>
      ({
        id: String(role._id),
        name: String(role.name ?? ""),
        description: String(role.description ?? ""),
        permissionCount: Array.isArray(role.permissions) ? role.permissions.length : 0,
        isSystem: Boolean(role.isSystem ?? false),
        isActive: Boolean(role.isActive ?? true),
        createdAt: role.createdAt ? new Date(role.createdAt).toISOString() : "",
      }) satisfies RoleListItem
  );
}

export async function getRoleById(id: string) {
  const db = await getDb();
  const role = await db.collection("roles").findOne({ _id: toObjectId(id) });

  if (!role) {
    return null;
  }

  return {
    id: String(role._id),
    name: String(role.name ?? ""),
    description: String(role.description ?? ""),
    permissionIds: Array.isArray(role.permissions)
      ? role.permissions.map((permissionId) => String(permissionId))
      : [],
    isSystem: Boolean(role.isSystem ?? false),
    isActive: Boolean(role.isActive ?? true),
  };
}

async function validatePermissionIds(permissionIds: string[]) {
  const db = await getDb();
  const uniqueIds = [...new Set(permissionIds.filter(Boolean))];

  if (!uniqueIds.length) {
    return [] as ObjectId[];
  }

  const invalidId = uniqueIds.find((permissionId) => !ObjectId.isValid(permissionId));

  if (invalidId) {
    throw new Error("One or more selected permissions are invalid.");
  }

  const objectIds = uniqueIds.map((permissionId) => new ObjectId(permissionId));
  const count = await db.collection("permissions").countDocuments({
    _id: { $in: objectIds },
    isActive: true,
  });

  if (count !== objectIds.length) {
    throw new Error("One or more selected permissions do not exist.");
  }

  return objectIds;
}

export async function createRole(input: RoleFormValues) {
  const db = await getDb();
  const name = input.name.trim();
  const existing = await db.collection("roles").findOne({ name });

  if (existing) {
    throw new Error("A role with this name already exists.");
  }

  const permissionObjectIds = await validatePermissionIds(input.permissionIds);
  const now = new Date();

  const result = await db.collection("roles").insertOne({
    name,
    description: input.description.trim(),
    permissions: permissionObjectIds,
    isSystem: false,
    isActive: input.isActive,
    createdAt: now,
    updatedAt: now,
  });

  return { id: String(result.insertedId) };
}

export async function updateRole(id: string, input: RoleFormValues) {
  const db = await getDb();
  const roleId = toObjectId(id);
  const existing = await db.collection("roles").findOne({ _id: roleId });

  if (!existing) {
    throw new Error("Role not found.");
  }

  const name = input.name.trim();
  const duplicate = await db.collection("roles").findOne({
    name,
    _id: { $ne: roleId },
  });

  if (duplicate) {
    throw new Error("A role with this name already exists.");
  }

  const permissionObjectIds = await validatePermissionIds(input.permissionIds);

  await db.collection("roles").updateOne(
    { _id: roleId },
    {
      $set: {
        name,
        description: input.description.trim(),
        permissions: permissionObjectIds,
        isActive: input.isActive,
        updatedAt: new Date(),
      },
    }
  );

  return { id };
}

export async function deleteRole(id: string) {
  const db = await getDb();
  const roleId = toObjectId(id);
  const existing = await db.collection("roles").findOne({ _id: roleId });

  if (!existing) {
    throw new Error("Role not found.");
  }

  if (existing.isSystem) {
    throw new Error("System roles cannot be deleted.");
  }

  const usersWithRole = await db.collection("users").countDocuments({
    role: roleId,
  });

  if (usersWithRole > 0) {
    throw new Error("This role is assigned to one or more users and cannot be deleted.");
  }

  await db.collection("roles").deleteOne({ _id: roleId });

  return { id };
}
