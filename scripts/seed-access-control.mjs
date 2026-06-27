import "dotenv/config";
import { MongoClient } from "mongodb";

const permissions = [
  {
    module: "Dashboard",
    action: "View",
    code: "DASHBOARD_VIEW",
    description: "Can view the dashboard",
  },
  {
    module: "User",
    action: "View",
    code: "USER_VIEW",
    description: "Can view users",
  },
  {
    module: "User",
    action: "Create",
    code: "USER_CREATE",
    description: "Can create users",
  },
  {
    module: "User",
    action: "Edit",
    code: "USER_EDIT",
    description: "Can edit users",
  },
  {
    module: "User",
    action: "Delete",
    code: "USER_DELETE",
    description: "Can delete users",
  },
  {
    module: "Role",
    action: "View",
    code: "ROLE_VIEW",
    description: "Can view roles",
  },
  {
    module: "Role",
    action: "Create",
    code: "ROLE_CREATE",
    description: "Can create roles",
  },
  {
    module: "Role",
    action: "Edit",
    code: "ROLE_EDIT",
    description: "Can edit roles",
  },
  {
    module: "Role",
    action: "Delete",
    code: "ROLE_DELETE",
    description: "Can delete roles",
  },
  {
    module: "Permission",
    action: "View",
    code: "PERMISSION_VIEW",
    description: "Can view permissions",
  },
  {
    module: "Permission",
    action: "Create",
    code: "PERMISSION_CREATE",
    description: "Can create permissions",
  },
  {
    module: "Permission",
    action: "Edit",
    code: "PERMISSION_EDIT",
    description: "Can edit permissions",
  },
  {
    module: "Permission",
    action: "Delete",
    code: "PERMISSION_DELETE",
    description: "Can delete permissions",
  },
];

const rolePermissionCodes = {
  "Super Admin": permissions.map((permission) => permission.code),
  Owner: [
    "DASHBOARD_VIEW",
    "USER_VIEW",
    "USER_CREATE",
    "USER_EDIT",
    "ROLE_VIEW",
    "ROLE_CREATE",
    "ROLE_EDIT",
    "PERMISSION_VIEW",
    "PERMISSION_CREATE",
    "PERMISSION_EDIT",
  ],
  Manager: ["DASHBOARD_VIEW", "USER_VIEW", "PERMISSION_VIEW"],
  "Inventory Executive": ["DASHBOARD_VIEW", "USER_VIEW", "PERMISSION_VIEW"],
  "Sales Executive": ["DASHBOARD_VIEW", "USER_VIEW", "PERMISSION_VIEW"],
};

const roles = [
  {
    name: "Super Admin",
    description: "Full Access",
    isSystem: true,
    isActive: true,
  },
  {
    name: "Owner",
    description: "Business Owner",
    isSystem: true,
    isActive: true,
  },
  {
    name: "Manager",
    description: "Store Manager",
    isSystem: true,
    isActive: true,
  },
  {
    name: "Inventory Executive",
    description: "Purchase + Karigar",
    isSystem: true,
    isActive: true,
  },
  {
    name: "Sales Executive",
    description: "Approval + Billing",
    isSystem: true,
    isActive: true,
  },
];

function getMongoUri() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("Missing MONGODB_URI environment variable.");
  }

  return uri;
}

async function main() {
  const client = new MongoClient(getMongoUri());

  try {
    await client.connect();
    const dbName = process.env.MONGODB_DB_NAME || "gold-smith";
    const db = client.db(dbName);
    const permissionsCollection = db.collection("permissions");
    const rolesCollection = db.collection("roles");

    for (const permission of permissions) {
      await permissionsCollection.updateOne(
        { code: permission.code },
        {
          $set: {
            module: permission.module,
            action: permission.action,
            description: permission.description,
            isActive: true,
          },
          $setOnInsert: {
            createdAt: new Date(),
          },
        },
        { upsert: true }
      );
    }

    const permissionDocs = await permissionsCollection
      .find({ code: { $in: permissions.map((permission) => permission.code) } })
      .toArray();

    const permissionIdByCode = new Map(
      permissionDocs.map((permission) => [permission.code, permission._id])
    );

    for (const role of roles) {
      const permissionIds = (rolePermissionCodes[role.name] || [])
        .map((code) => permissionIdByCode.get(code))
        .filter(Boolean);

      await rolesCollection.updateOne(
        { name: role.name },
        {
          $set: {
            description: role.description,
            isSystem: role.isSystem,
            isActive: role.isActive,
            permissions: permissionIds,
          },
          $setOnInsert: {
            createdAt: new Date(),
          },
        },
        { upsert: true }
      );
    }

    console.log(
      `Seeded ${permissions.length} permissions and ${roles.length} roles.`
    );
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
