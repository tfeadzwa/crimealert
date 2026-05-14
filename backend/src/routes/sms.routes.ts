import { Router } from 'express';
import { postIncomingSms, getOutgoingSms, postOutgoingResult, getSmsMessages, markSmsProcessed } from '../controllers/sms.controller';
import { getSmsInbox, approveSmsReport, rejectSmsReport, askClarificationSms, getSmsInboxStats, getConversation, sendChatMessage } from '../controllers/sms.admin.controller';
import { authMiddleware, requireRole } from '../middleware/auth.middleware';

const router = Router();

// Gateway endpoints (API key auth)
router.post('/incoming_sms', postIncomingSms);
router.get('/outgoing_sms', getOutgoingSms);
router.post('/outgoing_sms/result', postOutgoingResult);

// Admin endpoints for managing inbound SMS (JWT auth, police only)
router.get('/sms_messages', authMiddleware, requireRole(['admin', 'supervisor', 'officer']), getSmsMessages);
router.post('/sms_messages/:id/mark_processed', authMiddleware, requireRole(['admin', 'supervisor', 'officer']), markSmsProcessed);

// Police Dashboard SMS Inbox endpoints
router.get('/admin/sms-inbox', authMiddleware, requireRole(['admin', 'supervisor', 'officer']), getSmsInbox);
router.get('/admin/sms-inbox/stats', authMiddleware, requireRole(['admin', 'supervisor', 'officer']), getSmsInboxStats);
router.post('/admin/sms-inbox/:smsId/approve', authMiddleware, requireRole(['admin', 'supervisor', 'officer']), approveSmsReport);
router.post('/admin/sms-inbox/:smsId/reject', authMiddleware, requireRole(['admin', 'supervisor', 'officer']), rejectSmsReport);
router.post('/admin/sms-inbox/:smsId/ask-clarification', authMiddleware, requireRole(['admin', 'supervisor', 'officer']), askClarificationSms);

// Conversation thread endpoints
router.get('/admin/sms-conversation/:phone', authMiddleware, requireRole(['admin', 'supervisor', 'officer']), getConversation);
router.post('/admin/sms-conversation/:phone/send', authMiddleware, requireRole(['admin', 'supervisor', 'officer']), sendChatMessage);

export default router;
