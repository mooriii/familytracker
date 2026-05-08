import { Response, NextFunction } from 'express';
import { verifyAccessToken } from '../lib/jwt';
import { AuthRequest } from '../types';

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ data: null, error: 'Missing or invalid authorization header' });
    return;
  }

  const token = authHeader.slice(7);

  try {
    req.user = verifyAccessToken(token);
    next();
  } catch {
    res.status(401).json({ data: null, error: 'Invalid or expired token' });
  }
}

export function requireRole(role: 'PARENT' | 'CHILD') {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (req.user?.role !== role) {
      res.status(403).json({ data: null, error: 'Insufficient permissions' });
      return;
    }
    next();
  };
}
