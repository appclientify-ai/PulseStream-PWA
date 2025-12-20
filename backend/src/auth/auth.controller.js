
import { generateToken } from './jwt.js';

export const login = async (req, res) => {
  const { username } = req.body;
  const token = generateToken({ username });
  res.json({ token, user: { username } });
};

export const signup = async (req, res) => {
  const { username } = req.body;
  const token = generateToken({ username });
  res.status(201).json({ token, user: { username } });
};
