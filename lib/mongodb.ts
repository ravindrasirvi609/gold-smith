import { MongoClient, type Db } from "mongodb";

const dbName = process.env.MONGODB_DB_NAME ?? "gold-smith";

let clientPromise: Promise<MongoClient> | undefined;

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
  const client = new MongoClient(getMongoUri());
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
  return mongoClient.db(dbName);
}

export { dbName };
