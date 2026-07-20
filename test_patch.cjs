const { MongoClient } = require('mongodb');

async function test() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/clientify';
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('clientify');
    const items = db.collection('items');
    
    // Insert a dummy app_data
    const res = await items.insertOne({ name: 'app_data_test', createdBy: 'test_user', data: {} });
    console.log('Inserted:', res.insertedId);
    
    // Patch it
    const result = await items.findOneAndUpdate(
      { _id: res.insertedId },
      { $set: { "data.2023.client1.r1": true } },
      { returnDocument: 'after' }
    );
    console.log('Result after patch:', JSON.stringify(result, null, 2));
    
  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}
test();
