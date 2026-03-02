
import { getCollection } from '../db/mongo.js';
import { generateToken } from './jwt.js';
import { ObjectId } from 'mongodb';

export const signup = async (req, res) => {
  const { username, mobile_no, email_id, firm_name, gstn, user_id, password } = req.body;

  if (!username || !email_id || !user_id || !password) {
    return res.status(400).json({ error: 'Principal identity fields are mandatory' });
  }

  try {
    const users = getCollection('users');
    
    // Check for collisions in unique identifier space
    const existing = await users.findOne({ 
      $or: [
        { email_id: email_id },
        { user_id: user_id }
      ]
    });

    if (existing) {
      if (existing.email_id === email_id) return res.status(400).json({ error: 'Professional email already registered' });
      if (existing.user_id === user_id) return res.status(400).json({ error: 'Master User ID is already claimed' });
    }

    const newUser = {
      username,
      mobile_no: mobile_no || null,
      email_id,
      firm_name: firm_name || null,
      gstn: gstn || null,
      user_id: user_id,
      password, // Note: For production, implement bcrypt hashing
      createdAt: new Date(),
      status: 'online',
      avatar: null
    };

    const result = await users.insertOne(newUser);
    const userResponse = { 
      id: result.insertedId, 
      username, 
      user_id: newUser.user_id, 
      email_id,
      firm_name: newUser.firm_name,
      gstn: newUser.gstn,
      avatar: newUser.avatar
    };
    const token = generateToken({ ...newUser, _id: result.insertedId });

    res.status(201).json({
      token,
      user: userResponse
    });
  } catch (err) {
    console.error('Onboarding Error:', err);
    res.status(500).json({ error: 'Firm registration failed during vault initialization' });
  }
};

export const login = async (req, res) => {
  const { user_id, password } = req.body;

  if (!user_id || !password) {
    return res.status(400).json({ error: 'Credentials required for vault access' });
  }

  // Temporary hardcoded login for development/testing
  if (user_id === 'id-a' && password === 'password-a') {
    const tempUser = {
      _id: new ObjectId('00000000000000000000000a'),
      username: 'Temporary Admin',
      user_id: 'id-a',
      email_id: 'temp@example.com',
      firm_name: 'Temporary Firm',
      gstn: 'TEMP00000000000',
      avatar: null
    };
    const token = generateToken(tempUser);
    return res.json({
      token,
      user: { 
        id: tempUser._id, 
        username: tempUser.username, 
        user_id: tempUser.user_id, 
        email_id: tempUser.email_id,
        firm_name: tempUser.firm_name,
        gstn: tempUser.gstn,
        avatar: tempUser.avatar
      }
    });
  }

  try {
    const users = getCollection('users');
    const user = await users.findOne({ user_id: user_id });

    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'Authentication failed. Invalid User ID or Password.' });
    }

    const token = generateToken(user);
    res.json({
      token,
      user: { 
        id: user._id, 
        username: user.username, 
        user_id: user.user_id, 
        email_id: user.email_id,
        firm_name: user.firm_name,
        gstn: user.gstn,
        avatar: user.avatar
      }
    });
  } catch (err) {
    console.error('Authentication Error:', err);
    res.status(500).json({ error: 'Vault access denied due to internal error' });
  }
};

export const recoverIdentity = async (req, res) => {
  const { username, mobile_no, email_id } = req.body;

  if (!username || !mobile_no || !email_id) {
    return res.status(400).json({ error: 'Name, Mobile, and Email are required for identity lookup' });
  }

  try {
    const users = getCollection('users');
    // Case-insensitive search for identity matches
    const user = await users.findOne({
      username: { $regex: new RegExp(`^${username}$`, 'i') },
      mobile_no: mobile_no,
      email_id: { $regex: new RegExp(`^${email_id}$`, 'i') }
    });

    if (!user) {
      return res.status(404).json({ error: 'No practitioner found with these details.' });
    }

    res.json({ user_id: user.user_id });
  } catch (err) {
    console.error('Recovery Error:', err);
    res.status(500).json({ error: 'Lookup failed during vault synchronization.' });
  }
};

export const resetPasswordRecovery = async (req, res) => {
  const { user_id, new_password, username, mobile_no, email_id } = req.body;

  if (!user_id || !new_password || !username || !mobile_no || !email_id) {
    return res.status(400).json({ error: 'Missing security verification parameters.' });
  }

  try {
    const users = getCollection('users');
    const user = await users.findOne({
      user_id: user_id,
      username: { $regex: new RegExp(`^${username}$`, 'i') },
      mobile_no: mobile_no,
      email_id: { $regex: new RegExp(`^${email_id}$`, 'i') }
    });

    if (!user) {
      return res.status(403).json({ error: 'Identity validation failed. Access denied.' });
    }

    await users.updateOne(
      { _id: user._id },
      { $set: { password: new_password, updatedAt: new Date() } }
    );

    res.json({ message: 'Success' });
  } catch (err) {
    res.status(500).json({ error: 'Password vault rotation failed.' });
  }
};

export const me = async (req, res) => {
  // Returns user found by authenticate middleware
  res.json({ 
    user: {
      id: req.user._id,
      username: req.user.username,
      user_id: req.user.user_id,
      email_id: req.user.email_id,
      firm_name: req.user.firm_name,
      gstn: req.user.gstn,
      avatar: req.user.avatar
    } 
  });
};

export const updateProfile = async (req, res) => {
  const { username, mobile_no, email_id, firm_name, gstn, user_id, password, avatar } = req.body;
  const userId = req.user._id;

  try {
    const users = getCollection('users');
    const updateData = {};
    if (username) updateData.username = username;
    if (mobile_no) updateData.mobile_no = mobile_no;
    if (email_id) updateData.email_id = email_id;
    if (firm_name) updateData.firm_name = firm_name;
    if (gstn) updateData.gstn = gstn;
    if (user_id) updateData.user_id = user_id;
    if (password) updateData.password = password;
    if (avatar !== undefined) updateData.avatar = avatar;

    // Check if new user_id is taken
    if (user_id && user_id !== req.user.user_id) {
      const existing = await users.findOne({ user_id: user_id });
      if (existing) return res.status(400).json({ error: 'New Master User ID is already claimed' });
    }

    const result = await users.findOneAndUpdate(
      { _id: new ObjectId(userId) },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    if (!result) return res.status(404).json({ error: 'User not found' });

    res.json({
      user: {
        id: result._id,
        username: result.username,
        user_id: result.user_id,
        email_id: result.email_id,
        firm_name: result.firm_name,
        gstn: result.gstn,
        avatar: result.avatar
      }
    });
  } catch (err) {
    console.error('Profile Update Error:', err);
    res.status(500).json({ error: 'Failed to update professional profile' });
  }
};
