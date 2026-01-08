import { MongoClient, ServerApiVersion } from 'mongodb';

const uri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME || 'clientify';

if (!uri) {
  console.error('❌ FATAL: MONGODB_URI environment variable is missing.');
}

export const client = new MongoClient(uri || 'mongodb://localhost:27017/clientify', {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
  connectTimeoutMS: 15000,
  serverSelectionTimeoutMS: 15000
});

export async function connectDB() {
  if (!uri) throw new Error("MONGODB_URI is required for vault initialization.");

  try {
    console.log('🛡️  Initializing Vault Connection...');
    await client.connect();
    
    // Test connectivity
    await client.db("admin").command({ ping: 1 });
    console.log("✅ Secure connection established with MongoDB Cluster.");

    const db = client.db(dbName);
    
    // Establish primary indexes for performance and uniqueness
    await db.collection('users').createIndex({ user_id: 1 }, { unique: true });
    await db.collection('users').createIndex({ email_id: 1 }, { unique: true });
    await db.collection('items').createIndex({ createdBy: 1, name: 1 });
    
    return db;
  } catch (error) {
    console.error('❌ Connection Protocol Failed:', error.message);
    // Exit to allow container orchestration (Render/K8s) to restart the process
    process.exit(1); 
  }
}

export const getDB = () => client.db(dbName);
export const getCollection = (name) => client.db(dbName).collection(name);
