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

// SMS Parser - extracts structured data from SMS
const parseSmsReport = (body: string): { type?: string; location?: string; description?: string } => {
  const result: { type?: string; location?: string; description?: string } = {};

  // Try to match format: CRIME: [type] | WHERE: [location] | WHAT: [description]
  const crimeMatch = body.match(/CRIME:\s*([^|]+)/i);
  const whereMatch = body.match(/WHERE:\s*([^|]+)/i);
  const whatMatch = body.match(/WHAT:\s*(.+?)(?:\||$)/i);

  if (crimeMatch) result.type = crimeMatch[1].trim();
  if (whereMatch) result.location = whereMatch[1].trim();
  if (whatMatch) result.description = whatMatch[1].trim();

  return result;
};

// Get SMS inbox for admin review
export const getSmsInbox = async (req: Request, res: Response) => {
  try {
    const status = (req.query.status as string) || 'pending_review';
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, parseInt(req.query.limit as string) || 20);
    const skip = (page - 1) * limit;

    const messages = await prisma.smsMessage.findMany({
      where: {
        processed: false,
        // Future: add reviewStatus filter when Report model updated
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    const total = await prisma.smsMessage.count({
      where: {
        processed: false,
      },
    });

    const inbox = messages.map(msg => ({
      smsId: msg.id,
      sender: msg.sender,
      body: msg.body,
      receivedAt: msg.receivedAt,
      externalId: msg.externalId,
      extractedData: parseSmsReport(msg.body),
      createdAt: msg.createdAt,
    }));

    return res.json({
      success: true,
      data: {
        inbox,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    logger.error('Error in getSmsInbox', { error });
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Approve SMS and create formal Report
export const approveSmsReport = async (req: Request, res: Response) => {
  try {
    const { smsId } = req.params;
    const { priority = 'medium', latitude, longitude, notes } = req.body;

    const sms = await prisma.smsMessage.findUnique({
      where: { id: smsId },
    });

    if (!sms) {
      return res.status(404).json({
        success: false,
        message: 'SMS not found',
      });
    }

    const parsed = parseSmsReport(sms.body);

    // Generate reference number
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const referenceNumber = `SMS-${timestamp}-${random}`;

    // Create formal Report
    const report = await prisma.report.create({
      data: {
        referenceNumber,
        type: parsed.type || 'general',
        title: `SMS Report from ${sms.sender}`,
        description: parsed.description || sms.body,
        address: parsed.location,
        latitude,
        longitude,
        status: 'pending',
        priority,
        isAnonymous: false,
        contactMethod: 'sms',
        contactValue: sms.sender, // Store encrypted in production
        originalLanguage: 'en',
        sourceChannel: 'sms',
        smsMessageId: smsId,
        notificationPhone: sms.sender,
        reviewStatus: 'approved',
        reviewedBy: req.user?.userId,
        reviewedAt: new Date(),
        reviewNotes: notes,
      },
    });

    // Update SMS to mark as processed
    await prisma.smsMessage.update({
      where: { id: smsId },
      data: {
        processed: true,
      },
    });

    // Send ACK SMS to citizen
    const ackBody = `CrimeAlert: Your report has been received (Ref: ${report.referenceNumber}). We will investigate. Thank you.`;
    await prisma.outgoingSmsInstruction.create({
      data: {
        to: sms.sender,
        body: ackBody,
        status: 'pending',
      },
    });

    logger.info('SMS report approved and converted to formal report', {
      smsId,
      reportId: report.id,
      referenceNumber: report.referenceNumber,
    });

    return res.json({
      success: true,
      data: {
        report: {
          id: report.id,
          referenceNumber: report.referenceNumber,
          status: report.status,
          type: report.type,
          address: report.address,
        },
      },
    });
  } catch (error) {
    logger.error('Error in approveSmsReport', { error });
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Reject SMS
export const rejectSmsReport = async (req: Request, res: Response) => {
  try {
    const { smsId } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required',
      });
    }

    const sms = await prisma.smsMessage.findUnique({
      where: { id: smsId },
    });

    if (!sms) {
      return res.status(404).json({
        success: false,
        message: 'SMS not found',
      });
    }

    // Mark as processed (rejected)
    const payload = typeof sms.rawPayload === 'string' 
      ? JSON.parse(sms.rawPayload) 
      : sms.rawPayload || {};
    
    await prisma.smsMessage.update({
      where: { id: smsId },
      data: {
        processed: true,
        rawPayload: { ...payload, rejected: true, reason },
      },
    });

    // Send rejection SMS
    const rejectBody = `CrimeAlert: Your report could not be processed. ${reason}`;
    await prisma.outgoingSmsInstruction.create({
      data: {
        to: sms.sender,
        body: rejectBody,
        status: 'pending',
      },
    });

    logger.info('SMS report rejected', {
      smsId,
      reason,
    });

    return res.json({
      success: true,
      message: 'SMS report rejected',
    });
  } catch (error) {
    logger.error('Error in rejectSmsReport', { error });
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Ask for clarification
export const askClarificationSms = async (req: Request, res: Response) => {
  try {
    const { smsId } = req.params;
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({
        success: false,
        message: 'Clarification question is required',
      });
    }

    const sms = await prisma.smsMessage.findUnique({
      where: { id: smsId },
    });

    if (!sms) {
      return res.status(404).json({
        success: false,
        message: 'SMS not found',
      });
    }

    // Send clarification question SMS
    const questionBody = `CrimeAlert: Police Response: ${question} Please reply to update your report.`;
    await prisma.outgoingSmsInstruction.create({
      data: {
        to: sms.sender,
        body: questionBody,
        status: 'pending',
      },
    });

    logger.info('Clarification requested for SMS', {
      smsId,
      question,
    });

    return res.json({
      success: true,
      message: 'Clarification question sent',
    });
  } catch (error) {
    logger.error('Error in askClarificationSms', { error });
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Get SMS inbox stats
export const getSmsInboxStats = async (req: Request, res: Response) => {
  try {
    const unprocessed = await prisma.smsMessage.count({
      where: { processed: false },
    });

    const processed = await prisma.smsMessage.count({
      where: { processed: true },
    });

    const total = await prisma.smsMessage.count();

    return res.json({
      success: true,
      data: {
        unprocessed,
        processed,
        total,
      },
    });
  } catch (error) {
    logger.error('Error in getSmsInboxStats', { error });
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Get full conversation thread for a phone number (both directions)
export const getConversation = async (req: Request, res: Response) => {
  try {
    const { phone } = req.params;
    if (!phone) {
      return res.status(400).json({ success: false, message: 'phone is required' });
    }

    // Fetch all incoming messages from this number
    const incoming = await prisma.smsMessage.findMany({
      where: { sender: phone },
      orderBy: { receivedAt: 'asc' },
    });

    // Fetch all outgoing instructions to this number
    const outgoing = await prisma.outgoingSmsInstruction.findMany({
      where: { to: phone },
      orderBy: { createdAt: 'asc' },
    });

    // Merge and sort by timestamp
    const thread = [
      ...incoming.map(m => ({
        id: m.id,
        direction: 'in' as const,
        body: m.body,
        timestamp: m.receivedAt.toISOString(),
        status: m.processed ? 'processed' : 'pending',
        smsId: m.id,
      })),
      ...outgoing.map(m => ({
        id: m.id,
        direction: 'out' as const,
        body: m.body,
        timestamp: m.createdAt.toISOString(),
        status: m.status,
        smsId: null,
      })),
    ].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    return res.json({ success: true, data: { phone, thread } });
  } catch (error) {
    logger.error('Error in getConversation', { error });
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Send a direct chat message to a phone number (creates OutgoingSmsInstruction)
export const sendChatMessage = async (req: Request, res: Response) => {
  try {
    const { phone } = req.params;
    const { message } = req.body;

    if (!phone || !message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'phone and message are required' });
    }

    const instr = await prisma.outgoingSmsInstruction.create({
      data: {
        to: phone,
        body: `CrimeAlert: ${message.trim()}`,
        status: 'pending',
      },
    });

    logger.info('Chat message queued', { phone, instrId: instr.id });
    return res.status(201).json({ success: true, data: { id: instr.id, status: instr.status } });
  } catch (error) {
    logger.error('Error in sendChatMessage', { error });
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
