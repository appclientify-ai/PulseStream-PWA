
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/pulsetream';
export const client = new MongoClient(uri);

export async function connectDB() {
  await client.connect();
  console.log('Connected to MongoDB');
}

export const getDB = () => client.db();
