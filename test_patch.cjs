const { MongoClient } = require('mongodb');
async function run() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/clientify';
  const c = new MongoClient(uri);
  await c.connect();
  const db = c.db('clientify');
  const items = db.collection('items');
  const existing = await items.findOne({ name: 'app_data_clientify_monthly_filing_v3' });
  console.log("existing:", existing ? "YES" : "NO");
  if (existing) {
     console.log(JSON.stringify(existing.data, null, 2));
  }
  await c.close();
}
run();
