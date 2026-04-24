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

// Helper to validate API key
const validateApiKey = async (req: Request) => {
  const auth = req.headers.authorization || '';
  const parts = auth.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
  const apiKey = parts[1];
  const client = await prisma.gatewayClient.findUnique({ where: { apiKey } });
  return client;
};

// Accept incoming SMS from gateway
export const postIncomingSms = async (req: Request, res: Response) => {
  try {
    const client = await validateApiKey(req);
    if (!client) return res.status(401).json({ success: false, message: 'Invalid API key' });

    const { id: externalId, address, body, date } = req.body;
    if (!address || !body) {
      return res.status(400).json({ success: false, message: 'address and body are required' });
    }

    const receivedAt = date ? new Date(date) : new Date();

    const sms = await prisma.smsMessage.create({
      data: {
        externalId: externalId || null,
        sender: address,
        body,
        receivedAt,
        rawPayload: req.body,
      }
    });

    logger.info('Incoming SMS stored', { id: sms.id, sender: sms.sender });

    // Create a simple ACK outgoing instruction so gateway will send a confirmation SMS
    const ackRef = `SMS-${Date.now().toString(36).toUpperCase().slice(-6)}`;
    const ackBody = `CrimeAlert: We received your report (ref ${ackRef}). Thank you.`;

    const instr = await prisma.outgoingSmsInstruction.create({
      data: {
        to: sms.sender,
        body: ackBody,
        status: 'pending'
      }
    });

    return res.status(201).json({ success: true, data: { messageId: sms.id, ackInstructionId: instr.id, ackRef } });
  } catch (error) {
    logger.error('Error in postIncomingSms', { error });
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Provide pending outgoing instructions to gateway
export const getOutgoingSms = async (req: Request, res: Response) => {
  try {
    const client = await validateApiKey(req);
    if (!client) return res.status(401).json({ success: false, message: 'Invalid API key' });

    const items = await prisma.outgoingSmsInstruction.findMany({
      where: { status: 'pending' },
      orderBy: { createdAt: 'asc' },
      take: 50
    });

    // Map to lighter payload expected by gateway
    const out = items.map(i => ({ id: i.id, to: i.to, body: i.body }));
    return res.json(out);
  } catch (error) {
    logger.error('Error in getOutgoingSms', { error });
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Receive send result from gateway
export const postOutgoingResult = async (req: Request, res: Response) => {
  try {
    const client = await validateApiKey(req);
    if (!client) return res.status(401).json({ success: false, message: 'Invalid API key' });

    const { id, status, platform_id, error: err } = req.body;
    if (!id || !status) return res.status(400).json({ success: false, message: 'id and status required' });

    const instr = await prisma.outgoingSmsInstruction.update({
      where: { id },
      data: {
        status,
        platformId: platform_id || undefined,
        error: err || undefined,
        attempts: { increment: 1 }
      }
    });

    logger.info('Outgoing send result updated', { id: instr.id, status: instr.status });
    return res.json({ success: true, data: { id: instr.id, status: instr.status } });
  } catch (error) {
    logger.error('Error in postOutgoingResult', { error });
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// List inbound SMS messages (admin view)
export const getSmsMessages = async (req: Request, res: Response) => {
  try {
    // Basic auth via API key for now (same as gateway clients). In future, restrict to admin users.
    const client = await validateApiKey(req);
    if (!client) return res.status(401).json({ success: false, message: 'Invalid API key' });

    const messages = await prisma.smsMessage.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200
    });
    return res.json({ success: true, data: messages });
  } catch (error) {
    logger.error('Error in getSmsMessages', { error });
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Mark a message as processed and optionally link to a report
export const markSmsProcessed = async (req: Request, res: Response) => {
  try {
    const client = await validateApiKey(req);
    if (!client) return res.status(401).json({ success: false, message: 'Invalid API key' });

    const { id } = req.params;
    const { reportId } = req.body;
    if (!id) return res.status(400).json({ success: false, message: 'id required' });

    const data: any = { processed: true };
    if (reportId) data.rawPayload = { linkedReportId: reportId };

    const updated = await prisma.smsMessage.update({ where: { id }, data });
    return res.json({ success: true, data: updated });
  } catch (error) {
    logger.error('Error in markSmsProcessed', { error });
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
