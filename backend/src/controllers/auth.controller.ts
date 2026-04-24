import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { generateToken } from '../utils/auth';
import { logger } from '../utils/logger';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Hash password with salt
const hashPassword = (password: string): string => {
  const salt = crypto.randomBytes(16);
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return salt.toString('hex') + ':' + hash;
};

// Verify password
const verifyPassword = (password: string, hashedPassword: string): boolean => {
  const [saltHex, hash] = hashedPassword.split(':');
  const salt = Buffer.from(saltHex, 'hex');
  const computed = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return computed === hash;
};

// Police login
export const loginPolice = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user || !verifyPassword(password, user.passwordHash)) {
      logger.warn('Failed login attempt', { email, reason: 'invalid_credentials' });
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if user is police (admin or officer roles)
    if (!['admin', 'supervisor', 'officer'].includes(user.role)) {
      logger.warn('Unauthorized login attempt', { email, role: user.role });
      return res.status(403).json({
        success: false,
        message: 'Only police personnel can access this endpoint'
      });
    }

    if (!user.isActive) {
      logger.warn('Login attempt from inactive user', { email });
      return res.status(403).json({
        success: false,
        message: 'Your account is inactive'
      });
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });

    logger.info('Police officer logged in', {
      userId: user.id,
      email: user.email,
      role: user.role
    });

    return res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          badgeNumber: user.badgeNumber
        }
      }
    });
  } catch (error) {
    logger.error('Error in loginPolice', { error });
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Verify token (useful for frontend to check auth status)
export const verifyTokenEndpoint = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or missing token'
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive'
      });
    }

    return res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        }
      }
    });
  } catch (error) {
    logger.error('Error in verifyTokenEndpoint', { error });
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Create a new police user (admin only)
export const createPoliceUser = async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName, role, badgeNumber, station, department, phone } = req.body;

    if (!email || !password || !firstName || !lastName || !role) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, firstName, lastName, and role are required'
      });
    }

    if (!['admin', 'supervisor', 'officer'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be admin, supervisor, or officer'
      });
    }

    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Check if badge number is unique (if provided)
    if (badgeNumber) {
      const badgeExists = await prisma.user.findUnique({ where: { badgeNumber } });
      if (badgeExists) {
        return res.status(409).json({
          success: false,
          message: 'User with this badge number already exists'
        });
      }
    }

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: hashPassword(password),
        firstName,
        lastName,
        role,
        badgeNumber,
        station,
        department,
        phone,
        isActive: true
      }
    });

    logger.info('Police user created', {
      userId: user.id,
      email: user.email,
      role: user.role
    });

    return res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          badgeNumber: user.badgeNumber
        }
      }
    });
  } catch (error) {
    logger.error('Error in createPoliceUser', { error });
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
