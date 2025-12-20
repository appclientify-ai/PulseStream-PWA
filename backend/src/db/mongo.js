
import { MongoClient, ServerApiVersion } from 'mongodb';

const uri = process.env.MONGODB_URI;

if (!uri || uri.includes('<PASSWORD>')) {
  console.error('⚠️  WARNING: MONGODB_URI is not configured correctly.');
}

const dbName = process.env.DB_NAME || 'clientify';

export const client = new MongoClient(uri || 'mongodb://localhost:27017/clientify', {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
  connectTimeoutMS: 10000,
  serverSelectionTimeoutMS: 10000
});

export async function connectDB() {
  if (!uri) {
    console.error('❌ MONGODB_URI environment variable is missing.');
    throw new Error("MONGODB_URI is required.");
  }

  try {
    console.log('🔄 Connecting to MongoDB...');
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("✅ Successfully connected to MongoDB!");

    const db = client.db(dbName);
    
    // Ensure basic indexes
    await db.collection('users').createIndex({ user_id: 1 }, { unique: true });
    await db.collection('users').createIndex({ email_id: 1 }, { unique: true });
    
    return db;
  } catch (error) {
    console.error('❌ MongoDB Connection Failed:', error.message);
    // On Render/Netlify, we want the process to crash so it restarts
    process.exit(1); 
  }
}

export const getDB = () => client.db(dbName);
export const getCollection = (name) => client.db(dbName).collection(name);
