
import { MongoClient, ServerApiVersion } from 'mongodb';

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

let db;

export async function connectDB() {
  if (db) return db;
  try {
    await client.connect();
    db = client.db(process.env.DB_NAME || 'clientify_vault');
    console.log("🛡️ Vault connected to MongoDB Atlas");
    return db;
  } catch (error) {
    console.error('❌ DB Connection Failed:', error);
    process.exit(1);
  }
}

export const getCollection = (name) => db.collection(name);
