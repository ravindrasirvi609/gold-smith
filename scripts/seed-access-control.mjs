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
  {
    module: "Vendor",
    action: "View",
    code: "VENDOR_VIEW",
    description: "Can view vendors",
  },
  {
    module: "Vendor",
    action: "Create",
    code: "VENDOR_CREATE",
    description: "Can create vendors",
  },
  {
    module: "Vendor",
    action: "Edit",
    code: "VENDOR_EDIT",
    description: "Can edit vendors",
  },
  {
    module: "Vendor",
    action: "Delete",
    code: "VENDOR_DELETE",
    description: "Can delete vendors",
  },
  {
    module: "Customer",
    action: "View",
    code: "CUSTOMER_VIEW",
    description: "Can view customers",
  },
  {
    module: "Customer",
    action: "Create",
    code: "CUSTOMER_CREATE",
    description: "Can create customers",
  },
  {
    module: "Customer",
    action: "Edit",
    code: "CUSTOMER_EDIT",
    description: "Can edit customers",
  },
  {
    module: "Customer",
    action: "Delete",
    code: "CUSTOMER_DELETE",
    description: "Can delete customers",
  },
  {
    module: "Karigar",
    action: "View",
    code: "KARIGAR_VIEW",
    description: "Can view karigars",
  },
  {
    module: "Karigar",
    action: "Create",
    code: "KARIGAR_CREATE",
    description: "Can create karigars",
  },
  {
    module: "Karigar",
    action: "Edit",
    code: "KARIGAR_EDIT",
    description: "Can edit karigars",
  },
  {
    module: "Karigar",
    action: "Delete",
    code: "KARIGAR_DELETE",
    description: "Can delete karigars",
  },
  {
    module: "Purchase",
    action: "View",
    code: "PURCHASE_VIEW",
    description: "Can view purchases",
  },
  {
    module: "Purchase",
    action: "Create",
    code: "PURCHASE_CREATE",
    description: "Can create purchases",
  },
  {
    module: "Purchase",
    action: "Edit",
    code: "PURCHASE_EDIT",
    description: "Can edit purchases",
  },
  {
    module: "Purchase",
    action: "Delete",
    code: "PURCHASE_DELETE",
    description: "Can delete purchases",
  },
  {
    module: "Issue",
    action: "View",
    code: "ISSUE_VIEW",
    description: "Can view karigar issues",
  },
  {
    module: "Issue",
    action: "Create",
    code: "ISSUE_CREATE",
    description: "Can create karigar issues",
  },
  {
    module: "Issue",
    action: "Edit",
    code: "ISSUE_EDIT",
    description: "Can edit karigar issues",
  },
  {
    module: "Issue",
    action: "Delete",
    code: "ISSUE_DELETE",
    description: "Can delete karigar issues",
  },
  {
    module: "Receipt",
    action: "View",
    code: "RECEIPT_VIEW",
    description: "Can view karigar receipts",
  },
  {
    module: "Receipt",
    action: "Create",
    code: "RECEIPT_CREATE",
    description: "Can create karigar receipts",
  },
  {
    module: "Receipt",
    action: "Edit",
    code: "RECEIPT_EDIT",
    description: "Can edit karigar receipts",
  },
  {
    module: "Receipt",
    action: "Delete",
    code: "RECEIPT_DELETE",
    description: "Can delete karigar receipts",
  },
  {
    module: "Product",
    action: "View",
    code: "PRODUCT_VIEW",
    description: "Can view products",
  },
  {
    module: "Product",
    action: "Edit",
    code: "PRODUCT_EDIT",
    description: "Can edit products",
  },
  {
    module: "Product",
    action: "Delete",
    code: "PRODUCT_DELETE",
    description: "Can delete products",
  },
  {
    module: "History",
    action: "View",
    code: "HISTORY_VIEW",
    description: "Can view product history",
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
    "VENDOR_VIEW",
    "VENDOR_CREATE",
    "VENDOR_EDIT",
    "CUSTOMER_VIEW",
    "CUSTOMER_CREATE",
    "CUSTOMER_EDIT",
    "KARIGAR_VIEW",
    "KARIGAR_CREATE",
    "KARIGAR_EDIT",
    "PURCHASE_VIEW",
    "PURCHASE_CREATE",
    "PURCHASE_EDIT",
    "ISSUE_VIEW",
    "ISSUE_CREATE",
    "ISSUE_EDIT",
    "RECEIPT_VIEW",
    "RECEIPT_CREATE",
    "RECEIPT_EDIT",
    "PRODUCT_VIEW",
    "PRODUCT_EDIT",
    "HISTORY_VIEW",
  ],
  Manager: ["DASHBOARD_VIEW", "USER_VIEW", "PERMISSION_VIEW", "VENDOR_VIEW", "CUSTOMER_VIEW", "KARIGAR_VIEW", "PURCHASE_VIEW", "ISSUE_VIEW", "RECEIPT_VIEW", "PRODUCT_VIEW", "HISTORY_VIEW"],
  "Inventory Executive": ["DASHBOARD_VIEW", "USER_VIEW", "PERMISSION_VIEW", "VENDOR_VIEW", "KARIGAR_VIEW", "PURCHASE_VIEW", "PURCHASE_CREATE", "PURCHASE_EDIT", "ISSUE_VIEW", "ISSUE_CREATE", "ISSUE_EDIT", "RECEIPT_VIEW", "RECEIPT_CREATE", "RECEIPT_EDIT", "PRODUCT_VIEW", "HISTORY_VIEW"],
  "Sales Executive": ["DASHBOARD_VIEW", "USER_VIEW", "PERMISSION_VIEW", "CUSTOMER_VIEW"],
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
