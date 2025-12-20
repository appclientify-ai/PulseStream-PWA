
import { getCollection } from '../db/mongo.js';
import { generateToken } from './jwt.js';

// In production, use bcrypt for hashing. Using simple string check for this demo.
export const signup = async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const users = getCollection('users');
    const existing = await users.findOne({ email });

    if (existing) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const result = await users.insertOne({
      username,
      email,
      password, // Hash this with bcrypt.hash(password, 10) in production
      createdAt: new Date(),
      status: 'online'
    });

    const newUser = { _id: result.insertedId, username, email };
    const token = generateToken(newUser);

    res.status(201).json({
      token,
      user: { id: newUser._id, username: newUser.username, email: newUser.email }
    });
  } catch (err) {
    res.status(500).json({ error: 'Signup failed' });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  try {
    const users = getCollection('users');
    const user = await users.findOne({ email });

    // In production: await bcrypt.compare(password, user.password)
    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user);
    res.json({
      token,
      user: { id: user._id, username: user.username, email: user.email }
    });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
};

export const me = async (req, res) => {
  // req.user is already populated by authenticate middleware
  res.json({ user: req.user });
};
