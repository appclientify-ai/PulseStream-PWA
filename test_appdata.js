const { MongoClient } = require('mongodb');

async function test() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/clientify';
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db();
    const items = db.collection('items');
    const existing = await items.find({ name: { $regex: 'app_data' } }).toArray();
    console.log("AppData Items:", JSON.stringify(existing, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}
test();
