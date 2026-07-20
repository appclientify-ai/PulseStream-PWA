const { MongoClient } = require('mongodb');
const { MongoMemoryServer } = require('mongodb-memory-server');

async function run() {
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  console.log("Memory DB URI:", uri);
  
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('test');
  const items = db.collection('items');
  
  // Test the upsert logic
  const updates = { "data.2023_April.client1.r1": true };
  const key = "monthly_filing";
  const userId = "user123";
  
  try {
    const result = await items.findOneAndUpdate(
      { name: 'app_data_' + key, createdBy: userId },
      { 
        $set: { ...updates, updatedAt: new Date() },
        $setOnInsert: { name: 'app_data_' + key, createdBy: userId, createdAt: new Date() }
      },
      { upsert: true, returnDocument: 'after' }
    );
    console.log("Upsert result:", JSON.stringify(result, null, 2));
    
    // Test a second update
    const updates2 = { "data.2023_April.client2.r1": true };
    const result2 = await items.findOneAndUpdate(
      { _id: result._id || result.value._id },
      { $set: { ...updates2, updatedAt: new Date() } },
      { returnDocument: 'after' }
    );
    console.log("Update result:", JSON.stringify(result2, null, 2));
    
  } catch (err) {
    console.error("Error:", err);
  }
  
  await client.close();
  await mongod.stop();
}
run();
