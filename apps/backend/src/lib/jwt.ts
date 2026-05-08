import jwt from 'jsonwebtoken';

const ACCESS_SECRET = process.env.JWT_SECRET ?? 'dev_secret';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? 'dev_refresh_secret';

export interface TokenPayload {
  userId: string;
  role: 'PARENT' | 'CHILD';
  familyId: string | null;
}

export function signAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: '7d' });
}

export function signRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: '30d' });
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, ACCESS_SECRET) as TokenPayload;
}
