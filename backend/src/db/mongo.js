import { MongoClient, ServerApiVersion, ObjectId } from 'mongodb';
import fs from 'fs';
import path from 'path';

const uri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME || 'clientify';

const DATA_DIR = path.resolve(process.cwd(), '.data');
const DATA_FILE = path.join(DATA_DIR, 'db.json');

let isUsingFallback = false;
const fallbackData = {
  users: [],
  items: []
};

function loadFallbackData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed.users) fallbackData.users = parsed.users;
      if (parsed.items) fallbackData.items = parsed.items;
    }
  } catch (e) {
    console.warn('⚠️ Fallback data load warning:', e.message);
  }
}

function saveFallbackData() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(fallbackData, null, 2));
  } catch (e) {
    console.warn('⚠️ Fallback data save warning:', e.message);
  }
}

function setDeepProperty(obj, pathStr, value) {
  const parts = pathStr.split('.');
  let curr = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    if (!curr[p] || typeof curr[p] !== 'object') {
      curr[p] = {};
    }
    curr = curr[p];
  }
  curr[parts[parts.length - 1]] = value;
}

function getDeepProperty(obj, pathStr) {
  if (!obj || typeof obj !== 'object') return undefined;
  if (!pathStr.includes('.')) return obj[pathStr];
  const parts = pathStr.split('.');
  let curr = obj;
  for (const part of parts) {
    if (curr === null || curr === undefined || typeof curr !== 'object') return undefined;
    curr = curr[part];
  }
  return curr;
}

function matchFilter(doc, filter) {
  if (!filter || Object.keys(filter).length === 0) return true;
  for (const key of Object.keys(filter)) {
    if (key === '$or') {
      const conditions = filter['$or'];
      if (Array.isArray(conditions)) {
        const anyMatch = conditions.some(cond => matchFilter(doc, cond));
        if (!anyMatch) return false;
      }
      continue;
    }
    if (key === '$and') {
      const conditions = filter['$and'];
      if (Array.isArray(conditions)) {
        const allMatch = conditions.every(cond => matchFilter(doc, cond));
        if (!allMatch) return false;
      }
      continue;
    }

    const val = filter[key];
    let docVal = getDeepProperty(doc, key);
    if (key === '_id' || key === 'id') {
      docVal = doc._id || doc.id;
    }

    if (val !== null && typeof val === 'object' && !(val instanceof Date)) {
      if (val instanceof RegExp) {
        if (!val.test(String(docVal || ''))) return false;
        continue;
      }

      const opKeys = Object.keys(val).filter(k => k.startsWith('$'));
      if (opKeys.length > 0) {
        let allOpsPassed = true;
        for (const op of opKeys) {
          if (op === '$exists') {
            const exists = docVal !== undefined && docVal !== null;
            if (Boolean(val.$exists) !== exists) {
              allOpsPassed = false;
              break;
            }
          } else if (op === '$ne') {
            const neStr = val.$ne !== null && val.$ne !== undefined ? val.$ne.toString() : '';
            const targetStr = docVal !== null && docVal !== undefined ? docVal.toString() : '';
            if (targetStr === neStr || docVal === val.$ne) {
              allOpsPassed = false;
              break;
            }
          } else if (op === '$in' && Array.isArray(val.$in)) {
            const inStrings = val.$in.map(v => v !== null && v !== undefined ? v.toString() : '');
            const targetStr = docVal !== null && docVal !== undefined ? docVal.toString() : '';
            if (!inStrings.includes(targetStr)) {
              allOpsPassed = false;
              break;
            }
          } else if (op === '$nin' && Array.isArray(val.$nin)) {
            const inStrings = val.$nin.map(v => v !== null && v !== undefined ? v.toString() : '');
            const targetStr = docVal !== null && docVal !== undefined ? docVal.toString() : '';
            if (inStrings.includes(targetStr)) {
              allOpsPassed = false;
              break;
            }
          } else if (op === '$regex') {
            const reg = new RegExp(val.$regex.source || val.$regex, val.$options || val.$regex.flags || 'i');
            if (!reg.test(String(docVal || ''))) {
              allOpsPassed = false;
              break;
            }
          } else if (op === '$gt') {
            if (!(docVal > val.$gt)) {
              allOpsPassed = false;
              break;
            }
          } else if (op === '$gte') {
            if (!(docVal >= val.$gte)) {
              allOpsPassed = false;
              break;
            }
          } else if (op === '$lt') {
            if (!(docVal < val.$lt)) {
              allOpsPassed = false;
              break;
            }
          } else if (op === '$lte') {
            if (!(docVal <= val.$lte)) {
              allOpsPassed = false;
              break;
            }
          }
        }
        if (!allOpsPassed) return false;
        continue;
      }
    }

    const targetStr = docVal !== null && docVal !== undefined ? docVal.toString() : '';
    const valStr = val !== null && val !== undefined ? val.toString() : '';
    if (targetStr !== valStr && docVal !== val) return false;
  }
  return true;
}

function applyUpdates(doc, updateObj, isInsert = false) {
  if (updateObj.$set) {
    for (const [k, v] of Object.entries(updateObj.$set)) {
      setDeepProperty(doc, k, v);
    }
  }
  if (isInsert && updateObj.$setOnInsert) {
    for (const [k, v] of Object.entries(updateObj.$setOnInsert)) {
      setDeepProperty(doc, k, v);
    }
  }
}

class InMemoryCollection {
  constructor(name) {
    this.name = name;
    if (!fallbackData[name]) fallbackData[name] = [];
    this.list = fallbackData[name];
  }

  async createIndex() { return true; }

  async findOne(filter) {
    return this.list.find(doc => matchFilter(doc, filter)) || null;
  }

  find(filter, projectionObj) {
    let result = this.list.filter(doc => matchFilter(doc, filter));
    const createCursor = (list) => ({
      project: (proj) => createCursor(list),
      select: (proj) => createCursor(list),
      sort: (sortObj) => {
        const keys = Object.keys(sortObj || {});
        if (keys.length > 0) {
          const key = keys[0];
          const dir = sortObj[key];
          list.sort((a, b) => {
            const valA = a[key] || '';
            const valB = b[key] || '';
            if (valA < valB) return dir > 0 ? -1 : 1;
            if (valA > valB) return dir > 0 ? 1 : -1;
            return 0;
          });
        }
        return createCursor(list);
      },
      toArray: async () => list
    });
    return createCursor(result);
  }

  async insertOne(doc) {
    const _id = doc._id || new ObjectId();
    const newDoc = { ...doc, _id };
    this.list.push(newDoc);
    saveFallbackData();
    return { insertedId: _id, value: newDoc };
  }

  async updateOne(filter, update) {
    const doc = this.list.find(d => matchFilter(d, filter));
    if (doc) {
      applyUpdates(doc, update, false);
      saveFallbackData();
      return { modifiedCount: 1, matchedCount: 1 };
    }
    return { modifiedCount: 0, matchedCount: 0 };
  }

  async findOneAndUpdate(filter, update, options = {}) {
    let doc = this.list.find(d => matchFilter(d, filter));
    if (!doc && options.upsert) {
      const _id = new ObjectId();
      doc = { _id };
      applyUpdates(doc, update, true);
      this.list.push(doc);
      saveFallbackData();
      return doc;
    }
    if (doc) {
      applyUpdates(doc, update, false);
      saveFallbackData();
      return doc;
    }
    return null;
  }

  async deleteOne(filter) {
    const index = this.list.findIndex(d => matchFilter(d, filter));
    if (index !== -1) {
      this.list.splice(index, 1);
      saveFallbackData();
      return { deletedCount: 1 };
    }
    return { deletedCount: 0 };
  }

  watch() {
    return {
      on: () => {},
      close: () => {}
    };
  }
}

let realClient = null;

if (uri) {
  realClient = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
    connectTimeoutMS: 5000,
    serverSelectionTimeoutMS: 5000
  });
}

export const client = {
  close: async () => {
    if (realClient) {
      try { await realClient.close(); } catch (e) {}
    }
  }
};

export async function connectDB() {
  if (!uri) {
    console.warn('⚠️ MONGODB_URI environment variable is missing. Operating in resilient local storage mode.');
    isUsingFallback = true;
    loadFallbackData();
    return;
  }

  try {
    console.log('🛡️ Initializing Vault Connection...');
    await realClient.connect();
    await realClient.db("admin").command({ ping: 1 });
    console.log("✅ Secure connection established with MongoDB Cluster.");

    const db = realClient.db(dbName);
    await db.collection('users').createIndex({ user_id: 1 }, { unique: true });
    await db.collection('users').createIndex({ email_id: 1 }, { unique: true });
    await db.collection('items').createIndex({ createdBy: 1, name: 1, updatedAt: -1 });
    await db.collection('items').createIndex({ createdBy: 1, updatedAt: -1 });
    await db.collection('items').createIndex({ name: 1, updatedAt: -1 });
    return db;
  } catch (error) {
    console.warn('⚠️ Connection to remote MongoDB cluster failed:', error.message);
    console.warn('🛡️ Falling back to resilient local storage mode for uninterrupted server operation.');
    isUsingFallback = true;
    loadFallbackData();
  }
}

export const getDB = () => {
  if (isUsingFallback || !realClient) {
    return {
      collection: (name) => new InMemoryCollection(name)
    };
  }
  return realClient.db(dbName);
};

export const getCollection = (name) => {
  if (isUsingFallback || !realClient) {
    return new InMemoryCollection(name);
  }
  return realClient.db(dbName).collection(name);
};
