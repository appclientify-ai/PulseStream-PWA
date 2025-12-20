
import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'pulse-production-secret-change-me';

export const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user._id, 
      email: user.email, 
      username: user.username 
    }, 
    SECRET, 
    { expiresIn: '7d' }
  );
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, SECRET);
  } catch (err) {
    return null;
  }
};
