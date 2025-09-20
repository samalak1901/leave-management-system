import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import dotenv from 'dotenv';
dotenv.config();

export interface AuthRequest extends Request {
  user?: any;
}

const JWT_SECRET = process.env.JWT_SECRET || 'devsecret';

export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ message: 'Unauthorized' });
  const token = auth.slice(7);

  try {
    const payload: any = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(payload.sub).lean();
    if (!user) return res.status(401).json({ message: 'Invalid token user' });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

// Role guard
export function ensureRole(allowed: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    if (!allowed.includes(req.user.role)) return res.status(403).json({ message: 'Forbidden' });
    next();
  };
}