import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Generate unique reference number
const generateReferenceNumber = (): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `CR-${timestamp}-${random}`;
};

// Create a new report
export const createReport = async (req: Request, res: Response) => {
  try {
    const {
      type,
      title,
      description,
      latitude,
      longitude,
      address,
      landmark,
      occurredAt,
      isAnonymous,
      contactMethod,
      originalLanguage
    } = req.body;

    // Validation
    if (!type || !description) {
      return res.status(400).json({
        success: false,
        message: 'Type and description are required'
      });
    }

    const referenceNumber = generateReferenceNumber();

    const report = await prisma.report.create({
      data: {
        referenceNumber,
        type,
        title,
        description,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        address,
        landmark,
        occurredAt: occurredAt ? new Date(occurredAt) : null,
        isAnonymous: isAnonymous !== false,
        contactMethod: contactMethod || null,
        originalLanguage: originalLanguage || 'en',
        status: 'pending',
        priority: 'medium'
      }
    });

    logger.info('Report created', { referenceNumber });

    return res.status(201).json({
      success: true,
      message: 'Report created successfully',
      data: {
        referenceNumber: report.referenceNumber,
        id: report.id,
        status: report.status
      }
    });
  } catch (error) {
    logger.error('Error creating report', { error });
    return res.status(500).json({
      success: false,
      message: 'Failed to create report'
    });
  }
};

// Get report status by reference number
export const getReportStatus = async (req: Request, res: Response) => {
  try {
    const { referenceNumber } = req.params;

    const report = await prisma.report.findUnique({
      where: { referenceNumber },
      select: {
        id: true,
        referenceNumber: true,
        type: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        submittedAt: true,
        occurredAt: true,
        address: true,
        landmark: true,
        latitude: true,
        longitude: true,
        assignedTo: {
          select: {
            firstName: true,
            lastName: true,
            badgeNumber: true
          }
        },
        media: {
          select: {
            id: true,
            type: true,
            url: true,
            thumbnailUrl: true,
            originalFilename: true
          }
        }
      }
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    return res.json({
      success: true,
      data: report
    });
  } catch (error) {
    logger.error('Error fetching report', { error });
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch report'
    });
  }
};

// Get all reports (for police dashboard)
export const getAllReports = async (req: Request, res: Response) => {
  try {
    const {
      status,
      priority,
      type,
      page = '1',
      limit = '10',
      search
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      deletedAt: null
    };

    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (type) where.type = type;
    if (search) {
      where.OR = [
        { referenceNumber: { contains: search as string } },
        { description: { contains: search as string } },
        { address: { contains: search as string } }
      ];
    }

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { submittedAt: 'desc' },
        include: {
          assignedTo: {
            select: {
              firstName: true,
              lastName: true,
              badgeNumber: true
            }
          },
          media: {
            select: {
              id: true,
              type: true,
              url: true,
              thumbnailUrl: true
            }
          },
          _count: {
            select: { media: true }
          }
        }
      }),
      prisma.report.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        reports,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      }
    });
  } catch (error) {
    logger.error('Error fetching reports', { error });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reports'
    });
  }
};

// Update report status
export const updateReportStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, priority, resolutionNotes } = req.body;

    const updateData: any = {};
    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;
    if (resolutionNotes) updateData.resolutionNotes = resolutionNotes;
    if (status === 'resolved') updateData.resolvedAt = new Date();

    const report = await prisma.report.update({
      where: { id },
      data: updateData
    });

    logger.info('Report updated', { id, status });

    return res.json({
      success: true,
      message: 'Report updated successfully',
      data: report
    });
  } catch (error) {
    logger.error('Error updating report', { error });
    return res.status(500).json({
      success: false,
      message: 'Failed to update report'
    });
  }
};

// Get dashboard statistics
export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const [
      total,
      pending,
      under_review,
      investigating,
      resolved
    ] = await Promise.all([
      prisma.report.count({ where: { deletedAt: null } }),
      prisma.report.count({ where: { status: 'pending', deletedAt: null } }),
      prisma.report.count({ where: { status: 'under_review', deletedAt: null } }),
      prisma.report.count({ where: { status: 'investigating', deletedAt: null } }),
      prisma.report.count({ where: { status: 'resolved', deletedAt: null } })
    ]);

    return res.json({
      success: true,
      data: {
        total,
        pending,
        under_review,
        investigating,
        resolved
      }
    });
  } catch (error) {
    logger.error('Error fetching dashboard stats', { error });
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics'
    });
  }
};
