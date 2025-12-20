
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.warn('⚠️ MONGODB_URI not found in environment. Using local fallback.');
}

const dbName = process.env.DB_NAME || 'clientify';
const connectionString = uri || 'mongodb://localhost:27017';

export const client = new MongoClient(connectionString);

export async function connectDB() {
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(dbName);
    // Create unique indexes for critical user identifiers
    await db.collection('users').createIndex({ email_id: 1 }, { unique: true });
    await db.collection('users').createIndex({ mobile_no: 1 }, { unique: true });
    await db.collection('users').createIndex({ user_id: 1 }, { unique: true });
    
    await db.collection('items').createIndex({ createdAt: -1 });
    
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    throw error;
  }
}

export const getDB = () => client.db(dbName);
export const getCollection = (name) => client.db(dbName).collection(name);
