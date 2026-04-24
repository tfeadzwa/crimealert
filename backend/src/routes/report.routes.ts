import { Router } from 'express';
import { 
  createReport, 
  getReportStatus, 
  getAllReports,
  updateReportStatus,
  getDashboardStats
} from '../controllers/report.controller';
import { uploadMultiple } from '../middleware/upload.middleware';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const router = Router();
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Public endpoints
router.post('/', uploadMultiple, createReport);
router.get('/:referenceNumber/status', getReportStatus);

// Upload media for a report
router.post('/:reportId/media', uploadMultiple, async (req, res) => {
  try {
    const { reportId } = req.params;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    const mediaRecords = await Promise.all(
      files.map(file => 
        prisma.media.create({
          data: {
            reportId,
            type: file.mimetype.startsWith('image') ? 'image' 
                : file.mimetype.startsWith('video') ? 'video' 
                : 'audio',
            originalFilename: file.originalname,
            fileSize: BigInt(file.size),
            mimeType: file.mimetype,
            storageProvider: 'local',
            storageKey: file.filename,
            url: `/uploads/${file.filename}`,
            analysisStatus: 'pending'
          }
        })
      )
    );

    logger.info('Media files uploaded successfully', { reportId, fileCount: files.length });

    return res.status(201).json({
      success: true,
      message: 'Files uploaded successfully',
      data: mediaRecords
    });
  } catch (error) {
    logger.error('Error uploading media files', { error, reportId: req.params.reportId });
    return res.status(500).json({
      success: false,
      message: 'Failed to upload files',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Dashboard endpoints (will add auth later)
router.get('/dashboard/list', getAllReports);
router.get('/dashboard/stats', getDashboardStats);
router.put('/dashboard/:id', updateReportStatus);

export default router;
