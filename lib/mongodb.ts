import { MongoClient, type Db } from "mongodb";

const dbName = process.env.MONGODB_DB_NAME ?? "gold-smith";

let clientPromise: Promise<MongoClient> | undefined;
let indexPromise: Promise<void> | undefined;

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

function getMongoUri() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("Missing MONGODB_URI environment variable.");
  }

  return uri;
}

function createMongoClientPromise() {
  const client = new MongoClient(getMongoUri(), {
    // Reasonable pool defaults for a Next.js server environment.
    maxPoolSize: 20,
    minPoolSize: 2,
    serverSelectionTimeoutMS: 10_000,
    socketTimeoutMS: 45_000,
  });
  return client.connect();
}

export async function getMongoClient() {
  if (process.env.NODE_ENV === "development") {
    global._mongoClientPromise ??= createMongoClientPromise();
    return global._mongoClientPromise;
  }

  clientPromise ??= createMongoClientPromise();
  return clientPromise;
}

export async function getDb(): Promise<Db> {
  const mongoClient = await getMongoClient();
  const db = mongoClient.db(dbName);

  // Fire-and-forget index creation on first use per process. Never blocks
  // callers — indexes are created idempotently in the background.
  if (!indexPromise) {
    indexPromise = import("./indexes")
      .then((m) => m.ensureIndexesOnce())
      .catch((err) => {
        console.error("[mongodb] ensureIndexesOnce failed", err);
        indexPromise = undefined; // allow retry on next getDb() call
      });
  }

  return db;
}

export { dbName };
