
import { getCollection } from '../db/mongo.js';
import { generateToken } from './jwt.js';

export const signup = async (req, res) => {
  const { username, mobile_no, email_id, firm_name, gstn, user_id, password } = req.body;

  if (!username || !mobile_no || !email_id || !user_id || !password) {
    return res.status(400).json({ error: 'Required fields are missing' });
  }

  try {
    const users = getCollection('users');
    
    // Check if any of the unique fields are already taken
    const existing = await users.findOne({ 
      $or: [
        { email_id: email_id },
        { mobile_no: mobile_no },
        { user_id: user_id }
      ]
    });

    if (existing) {
      if (existing.email_id === email_id) return res.status(400).json({ error: 'Email already registered' });
      if (existing.mobile_no === mobile_no) return res.status(400).json({ error: 'Mobile number already registered' });
      if (existing.user_id === user_id) return res.status(400).json({ error: 'User ID already taken' });
    }

    const newUser = {
      username,
      mobile_no,
      email_id,
      firm_name: firm_name || null,
      gstn: gstn || null,
      user_id,
      password, // In production, hash this with bcrypt
      createdAt: new Date(),
      status: 'online'
    };

    const result = await users.insertOne(newUser);
    const userResponse = { id: result.insertedId, username, user_id, email_id };
    const token = generateToken(newUser);

    res.status(201).json({
      token,
      user: userResponse
    });
  } catch (err) {
    console.error('Signup Error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
};

export const login = async (req, res) => {
  const { user_id, password } = req.body;

  if (!user_id || !password) {
    return res.status(400).json({ error: 'User ID and password required' });
  }

  try {
    const users = getCollection('users');
    const user = await users.findOne({ user_id });

    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'Invalid user ID or password' });
    }

    const token = generateToken(user);
    res.json({
      token,
      user: { 
        id: user._id, 
        username: user.username, 
        user_id: user.user_id, 
        email_id: user.email_id 
      }
    });
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
};

export const me = async (req, res) => {
  res.json({ user: req.user });
};
