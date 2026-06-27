import "dotenv/config";
import bcrypt from "bcryptjs";
import { MongoClient, ObjectId } from "mongodb";

function getMongoUri() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("Missing MONGODB_URI environment variable.");
  }

  return uri;
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name} environment variable.`);
  }
  return value;
}

async function main() {
  const client = new MongoClient(getMongoUri());

  try {
    await client.connect();
    const dbName = process.env.MONGODB_DB_NAME || "gold-smith";
    const db = client.db(dbName);

    const email = requireEnv("SEED_ADMIN_EMAIL").toLowerCase();
    const password = requireEnv("SEED_ADMIN_PASSWORD");
    const firstName = process.env.SEED_ADMIN_FIRST_NAME || "Admin";
    const lastName = process.env.SEED_ADMIN_LAST_NAME || "User";

    const role = await db.collection("roles").findOne({ name: "Super Admin" });

    if (!role) {
      throw new Error('Missing role "Super Admin". Run access-control seed first.');
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await db.collection("users").updateOne(
      { email },
      {
        $set: {
          firstName,
          lastName,
          mobile: "",
          password: passwordHash,
          role: new ObjectId(role._id),
          profileImage: null,
          status: "ACTIVE",
          createdBy: null,
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );

    console.log(`Seeded admin user ${email}.`);
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
