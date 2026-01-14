
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { getCollection } from '../db/mongo.js';

export const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await getCollection('users').findOne({ _id: new ObjectId(decoded.id) });
    
    if (!user) return res.status(401).json({ error: 'Practitioner not found' });
    
    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired vault session' });
  }
};
