
import { MongoClient, ServerApiVersion } from 'mongodb';

const uri = process.env.MONGODB_URI;

/**
 * FULL ATLAS URL FORMAT:
 * mongodb+srv://<USERNAME>:<PASSWORD>@<CLUSTER_URL>/<DATABASE_NAME>?retryWrites=true&w=majority
 * 
 * 1. USERNAME: Your DB user name (Security > Database Access)
 * 2. PASSWORD: Your DB user password (Not your Atlas login password)
 * 3. CLUSTER_URL: The host provided by Atlas (e.g., cluster0.xyz.mongodb.net)
 * 4. DATABASE_NAME: Your preferred DB name (e.g., clientify)
 */

if (!uri) {
  console.error('❌ FATAL: MONGODB_URI environment variable is missing!');
  console.log('---------------------------------------------------------');
  console.log('👉 ACTION REQUIRED: Add MONGODB_URI to your environment variables.');
  console.log('👉 FORMAT: mongodb+srv://<user>:<password>@<cluster>.mongodb.net/<dbname>?retryWrites=true&w=majority');
  console.log('---------------------------------------------------------');
}

const dbName = process.env.DB_NAME || 'clientify';

export const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
  // Essential for multi-device sync (Change Streams) stability
  connectTimeoutMS: 15000,
  serverSelectionTimeoutMS: 15000,
  socketTimeoutMS: 45000,
  family: 4, // Use IPv4 for broader compatibility with cloud hosting
  retryWrites: true,
  w: 'majority'
});

export async function connectDB() {
  try {
    if (!uri) throw new Error("Connection string undefined");

    console.log('🔄 Connecting to MongoDB Atlas...');
    await client.connect();
    
    // Verify connection with a ping
    await client.db("admin").command({ ping: 1 });
    console.log("✅ Successfully authenticated with MongoDB Atlas!");

    const db = client.db(dbName);
    
    // Check for Replica Set status (Required for real-time sync across devices)
    const topologyType = client.topology?.description?.type;
    const isReplicaSet = topologyType?.includes('ReplicaSet') || topologyType?.includes('Sharded');
    
    if (isReplicaSet) {
      console.log('📡 Real-time Change Streams: ACTIVE (Multi-device sync enabled)');
    } else {
      console.warn('⚠️ WARNING: Connected to a standalone node. Multi-device real-time sync may be limited.');
    }
    
    // Ensure critical indexes exist
    await db.collection('users').createIndex({ user_id: 1 }, { unique: true });
    await db.collection('users').createIndex({ email_id: 1 }, { unique: true });
    await db.collection('items').createIndex({ createdAt: -1 });
    
    return db;
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    // Exit process so the hosting provider (Render/Netlify) can attempt a restart
    process.exit(1); 
  }
}

export const getDB = () => client.db(dbName);
export const getCollection = (name) => client.db(dbName).collection(name);
