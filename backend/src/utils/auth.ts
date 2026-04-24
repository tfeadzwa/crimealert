import jwt, { SignOptions } from 'jsonwebtoken';
import type { StringValue } from 'ms';

export interface AuthPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '24h';

export const generateToken = (payload: Omit<AuthPayload, 'iat' | 'exp'>): string => {
  const options: SignOptions = {
    expiresIn: JWT_EXPIRATION as StringValue | number,
    algorithm: 'HS256'
  };
  return jwt.sign(payload, JWT_SECRET, options);
};

export const verifyToken = (token: string): AuthPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthPayload;
  } catch (error) {
    return null;
  }
};

export const decodeToken = (token: string): AuthPayload | null => {
  try {
    return jwt.decode(token) as AuthPayload;
  } catch (error) {
    return null;
  }
};
