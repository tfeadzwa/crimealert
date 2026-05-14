import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { smsAPI } from '../services/api';
import { authService } from '../services/auth';
import { motion, AnimatePresence } from 'framer-motion';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface SmsMessage {
  smsId: string;
  sender: string;
  body: string;
  receivedAt: string;
  extractedData: {
    type?: string;
    location?: string;
    description?: string;
  };
  createdAt: string;
}

interface SmsStats {
  unprocessed: number;
  processed: number;
  total: number;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ThreadMessage {
  id: string;
  direction: 'in' | 'out';
  body: string;
  timestamp: string;
  status: string;
  smsId: string | null;
}

export default function SmsInboxPage() {
  const [messages, setMessages] = useState<SmsMessage[]>([]);
  const [stats, setStats] = useState<SmsStats | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [selectedSms, setSelectedSms] = useState<SmsMessage | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'clarify'>('approve');
  const [actionNote, setActionNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Chat panel state
  const [chatPhone, setChatPhone] = useState<string | null>(null);
  const [chatThread, setChatThread] = useState<ThreadMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatSending, setChatSending] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const chatPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const navigate = useNavigate();

  const showToast = useCallback((message: string, type: Toast['type'] = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  }, []);
  const user = authService.getUser();

  const handleLogout = () => {
    authService.logout();
    navigate('/');
  };

  const loadInbox = async (pageNum: number) => {
    setLoading(true);
    try {
      const res = await smsAPI.getInbox(pageNum, limit);
      console.log('Inbox response:', res.data?.inbox);
      setMessages(res.data?.inbox || []);
      setPagination(res.data?.pagination || null);
    } catch (e) {
      console.error('Failed to load messages', e);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const res = await smsAPI.getStats();
      setStats(res?.data || null);
    } catch (e) {
      console.error('Failed to load stats', e);
    }
  };

  useEffect(() => {
    loadInbox(page);
    loadStats();
  }, [page]);

  // ── Chat panel functions ──────────────────────────────────────────────────

  const fetchThread = useCallback(async (phone: string) => {
    try {
      const res = await smsAPI.getConversation(phone);
      setChatThread(res.data?.thread || []);
    } catch (e) {
      console.error('Failed to load conversation', e);
    }
  }, []);

  const openChat = useCallback((phone: string) => {
    setChatPhone(phone);
    setChatLoading(true);
    smsAPI.getConversation(phone)
      .then(res => setChatThread(res.data?.thread || []))
      .catch(() => {})
      .finally(() => setChatLoading(false));
  }, []);

  const closeChat = useCallback(() => {
    if (chatPollRef.current) clearInterval(chatPollRef.current);
    chatPollRef.current = null;
    setChatPhone(null);
    setChatThread([]);
    setChatInput('');
  }, []);

  // Start polling when chat opens, stop when it closes
  useEffect(() => {
    if (chatPollRef.current) clearInterval(chatPollRef.current);
    if (chatPhone) {
      chatPollRef.current = setInterval(() => fetchThread(chatPhone), 5000);
    }
    return () => {
      if (chatPollRef.current) clearInterval(chatPollRef.current);
    };
  }, [chatPhone, fetchThread]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatThread]);

  const handleChatSend = async () => {
    if (!chatPhone || !chatInput.trim() || chatSending) return;
    const msg = chatInput.trim();
    setChatInput('');
    setChatSending(true);
    try {
      await smsAPI.sendChatMessage(chatPhone, msg);
      await fetchThread(chatPhone);
      showToast('📨 Message queued for delivery via gateway.', 'info');
    } catch (e) {
      showToast('Failed to send message.', 'error');
      setChatInput(msg); // restore on failure
    } finally {
      setChatSending(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────

  const handleAction = async () => {
    if (!selectedSms) return;

    setActionLoading(true);
    try {
      if (actionType === 'approve') {
        await smsAPI.approveSms(selectedSms.smsId, { notes: actionNote });
        showToast('✅ Report approved and formal case created.', 'success');
      } else if (actionType === 'reject') {
        await smsAPI.rejectSms(selectedSms.smsId, { reason: actionNote });
        showToast('SMS rejected. A reply will be sent to the citizen via the gateway.', 'info');
      } else if (actionType === 'clarify') {
        await smsAPI.askClarification(selectedSms.smsId, { question: actionNote });
        showToast('📨 Clarification queued — the gateway app will send it to the citizen within 30 seconds.', 'info');
      }

      setShowActionModal(false);
      setActionNote('');
      setSelectedSms(null);
      loadInbox(page);
      loadStats();
    } catch (e) {
      console.error('Action failed', e);
      showToast('Action failed. Please check your connection and try again.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <header className="glass sticky top-0 z-50 border-b border-white/50 shadow-lg">
        <div className="container mx-auto px-4 py-5">
          <div className="flex items-center justify-between">
            {/* Left: Logo + Title */}
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2.5 rounded-xl shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-extrabold bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  SMS Inbox
                </h1>
                <p className="text-xs text-gray-500 mt-0.5">Review and manage citizen SMS reports</p>
              </div>
            </div>
            {/* Right: User + Logout */}
            <div className="flex items-center gap-3">
              <div className="hidden md:flex flex-col items-end">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Officer on Duty</p>
                <p className="font-bold text-gray-800 text-sm">{user?.firstName} {user?.lastName}</p>
                <span className="inline-block mt-0.5 px-2 py-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs rounded-full font-semibold capitalize">
                  {user?.role}
                </span>
              </div>
              <div className="w-11 h-11 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-xl shadow-lg">
                👮
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-semibold text-sm transition shadow-lg hover:shadow-xl hover:-translate-y-0.5 transform"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="mt-5 flex gap-2 overflow-x-auto -mx-4 px-4">
            <Link
              to="/dashboard"
              className="flex-shrink-0 flex items-center gap-2 py-2.5 px-5 bg-white text-gray-700 hover:text-blue-600 rounded-xl font-semibold text-sm transition border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              All Reports
            </Link>
            <button
              className="flex-shrink-0 flex items-center gap-2 py-2.5 px-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold text-sm shadow-lg"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              SMS Inbox
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-lg p-6"
            >
              <p className="text-gray-600 text-sm mb-2">📭 Unprocessed</p>
              <p className="text-4xl font-bold text-orange-600">{stats.unprocessed}</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl shadow-lg p-6"
            >
              <p className="text-gray-600 text-sm mb-2">✅ Processed</p>
              <p className="text-4xl font-bold text-green-600">{stats.processed}</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl shadow-lg p-6"
            >
              <p className="text-gray-600 text-sm mb-2">📊 Total</p>
              <p className="text-4xl font-bold text-blue-600">{stats.total}</p>
            </motion.div>
          </div>
        )}

        {/* SMS List */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <p className="text-gray-600">Loading SMS messages...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-2xl text-gray-400">📭</p>
              <p className="text-gray-600 mt-2">No SMS messages in inbox</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">From</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Extracted Type</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Location</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Message Preview</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Received</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {messages.map((sms, index) => (
                    <motion.tr
                      key={sms.smsId}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gray-50 transition"
                    >
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{sms.sender}</td>
                      <td className="px-6 py-4 text-sm">
                        {sms.extractedData?.type ? (
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                            {sms.extractedData.type}
                          </span>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {sms.extractedData?.location || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                        {sms.body.substring(0, 50)}...
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(sms.receivedAt).toLocaleDateString()} {new Date(sms.receivedAt).toLocaleTimeString()}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex gap-2 flex-wrap">
                          <button
                            onClick={() => openChat(sms.sender)}
                            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded transition"
                          >
                            💬 Chat
                          </button>
                          <button
                            onClick={() => {
                              setSelectedSms(sms);
                              setActionType('approve');
                              setActionNote('');
                              setShowActionModal(true);
                            }}
                            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition"
                          >
                            ✓ Approve
                          </button>
                          <button
                            onClick={() => {
                              setSelectedSms(sms);
                              setActionType('reject');
                              setActionNote('');
                              setShowActionModal(true);
                            }}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition"
                          >
                            ✕ Reject
                          </button>
                          <button
                            onClick={() => {
                              setSelectedSms(sms);
                              setActionType('clarify');
                              setActionNote('');
                              setShowActionModal(true);
                            }}
                            className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white text-xs rounded transition"
                          >
                            ❓ Clarify
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 rounded text-sm font-medium transition"
                >
                  ← Previous
                </button>
                <button
                  onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
                  disabled={page === pagination.totalPages}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 rounded text-sm font-medium transition"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Chat Slide-in Panel ─────────────────────────────────────── */}
      <AnimatePresence>
        {chatPhone && (
          <>
            {/* Backdrop */}
            <motion.div
              key="chat-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-gray-900/30 backdrop-blur-sm z-40"
              onClick={closeChat}
            />

            {/* Drawer */}
            <motion.div
              key="chat-drawer"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col"
            >
              {/* Drawer Header */}
              <div className="flex items-center gap-3 px-5 py-4 bg-gradient-to-r from-indigo-600 to-blue-600 text-white flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-lg font-bold flex-shrink-0">
                  {chatPhone.slice(-2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold truncate">{chatPhone}</p>
                  <p className="text-xs text-blue-100">SMS Conversation</p>
                </div>
                <button
                  onClick={closeChat}
                  className="ml-2 w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition text-lg"
                >
                  ✕
                </button>
              </div>

              {/* Messages area */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50">
                {chatLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-400 text-sm">Loading conversation...</p>
                  </div>
                ) : chatThread.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-400 text-sm">No messages yet.</p>
                  </div>
                ) : (
                  chatThread.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.direction === 'out' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[78%] px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
                          msg.direction === 'out'
                            ? 'bg-gradient-to-br from-indigo-600 to-blue-600 text-white rounded-br-sm'
                            : 'bg-white text-gray-800 border border-gray-200 rounded-bl-sm'
                        }`}
                      >
                        <p className="leading-relaxed">{msg.body}</p>
                        <div className={`flex items-center gap-1.5 mt-1 ${msg.direction === 'out' ? 'justify-end' : 'justify-start'}`}>
                          <span className={`text-[10px] ${msg.direction === 'out' ? 'text-blue-200' : 'text-gray-400'}`}>
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {' · '}
                            {new Date(msg.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </span>
                          {msg.direction === 'out' && (
                            <span className={`text-[10px] ${msg.status === 'sent' ? 'text-green-300' : 'text-yellow-300'}`}>
                              {msg.status === 'sent' ? '✓✓' : '⏳'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Input bar */}
              <div className="flex-shrink-0 px-4 py-3 bg-white border-t border-gray-200">
                <div className="flex gap-2 items-end">
                  <textarea
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleChatSend(); } }}
                    placeholder="Type a message... (Enter to send)"
                    rows={2}
                    className="flex-1 resize-none px-4 py-2.5 border border-gray-300 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  />
                  <button
                    onClick={handleChatSend}
                    disabled={chatSending || !chatInput.trim()}
                    className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-300 text-white rounded-2xl flex items-center justify-center transition shadow-lg"
                  >
                    {chatSending ? (
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 rotate-90" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                      </svg>
                    )}
                  </button>
                </div>
                <p className="text-[10px] text-gray-400 mt-1.5 text-center">Messages are sent via the SMS gateway app · auto-refreshes every 5s</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Action Modal */}
      {showActionModal && selectedSms && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full"
          >
            <h3 className="text-2xl font-bold mb-4">
              {actionType === 'approve' && '✓ Approve SMS'}
              {actionType === 'reject' && '✕ Reject SMS'}
              {actionType === 'clarify' && '❓ Ask Clarification'}
            </h3>

            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">SMS Details:</p>
              <p className="text-sm font-medium">From: {selectedSms.sender}</p>
              <p className="text-sm text-gray-600 mt-2">{selectedSms.body}</p>
            </div>

            <textarea
              value={actionNote}
              onChange={(e) => setActionNote(e.target.value)}
              placeholder={
                actionType === 'approve'
                  ? 'Optional notes...'
                  : actionType === 'reject'
                    ? 'Rejection reason (will be sent to citizen)...'
                    : 'Clarification question (will be sent to citizen)...'
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none mb-4"
              rows={4}
              required={actionType !== 'approve'}
            />

            <div className="flex gap-4">
              <button
                onClick={() => setShowActionModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium transition"
              >
                Cancel
              </button>
              <button
                onClick={handleAction}
                disabled={actionLoading || (actionType !== 'approve' && !actionNote)}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition"
              >
                {actionLoading ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Toast Notifications */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 60, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 60, scale: 0.9 }}
              className={`pointer-events-auto flex items-start gap-3 px-5 py-4 rounded-2xl shadow-2xl border max-w-sm text-sm font-medium
                ${toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
                  toast.type === 'info' ? 'bg-blue-50 border-blue-200 text-blue-800' :
                  'bg-green-50 border-green-200 text-green-800'}`}
            >
              <span className="flex-1">{toast.message}</span>
              <button onClick={() => setToasts(p => p.filter(t => t.id !== toast.id))} className="opacity-50 hover:opacity-100 transition">✕</button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
