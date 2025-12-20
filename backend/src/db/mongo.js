
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.warn('⚠️ MONGODB_URI not found in environment. Using local fallback.');
}

const dbName = process.env.DB_NAME || 'clientify';
const connectionString = uri || 'mongodb://localhost:27017';

// Set aggressive connection pool and timeout settings for high-speed responsiveness
export const client = new MongoClient(connectionString, {
  connectTimeoutMS: 5000,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 30000,
  maxPoolSize: 50,
  minPoolSize: 10,
  waitQueueTimeoutMS: 5000
});

export async function connectDB() {
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(dbName);
    
    // Ensure unique constraints exist to prevent duplicates as per requirements
    await db.collection('users').createIndex({ email_id: 1 }, { unique: true });
    await db.collection('users').createIndex({ mobile_no: 1 }, { unique: true });
    await db.collection('users').createIndex({ user_id: 1 }, { unique: true });
    
    await db.collection('items').createIndex({ createdAt: -1 });
    
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    throw error;
  }
}

export const getDB = () => client.db(dbName);
export const getCollection = (name) => client.db(dbName).collection(name);
