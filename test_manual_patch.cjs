const { MongoClient, ObjectId } = require('mongodb');

async function test() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/clientify';
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('clientify');
    const items = db.collection('items');
    
    const existing = await items.findOne({ name: 'app_data_test' });
    let id;
    if (!existing) {
      const res = await items.insertOne({ name: 'app_data_test', createdBy: 'test', data: {} });
      id = res.insertedId;
    } else {
      id = existing._id;
    }

    const updates = { 'data.2024-2025_April.12345.r1': true };
    const result = await items.findOneAndUpdate(
      { _id: id },
      { $set: updates },
      { returnDocument: 'after' }
    );
    console.log(result);
  } catch (err) {
    console.error("PATCH ERR:", err);
  } finally {
    await client.close();
  }
}
test();
