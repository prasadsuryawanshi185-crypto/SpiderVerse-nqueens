import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || "";
const dbName = process.env.DB_NAME || "";

if (!uri && process.env.NODE_ENV !== "development") {
  console.warn("MONGODB_URI is not set. Database connection will fail.");
}

if (!dbName && process.env.NODE_ENV !== "development") {
  console.warn("DB_NAME is not set. Database connection will fail.");
}

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri || "mongodb://localhost:27017");
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // In production, only instantiate if URI is provided, else use a dummy promise 
  // that will reject. This prevents build failures during static analysis.
  if (uri) {
    client = new MongoClient(uri);
    clientPromise = client.connect();
  } else {
    clientPromise = Promise.reject(new Error("MONGODB_URI is not set."));
  }
}

export { clientPromise, dbName };
