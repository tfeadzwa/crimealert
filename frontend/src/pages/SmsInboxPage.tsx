import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { smsAPI } from '../services/api';
import { authService } from '../services/auth';
import { motion } from 'framer-motion';

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
  const navigate = useNavigate();
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

  const handleAction = async () => {
    if (!selectedSms) return;

    setActionLoading(true);
    try {
      if (actionType === 'approve') {
        await smsAPI.approveSms(selectedSms.smsId, { notes: actionNote });
      } else if (actionType === 'reject') {
        await smsAPI.rejectSms(selectedSms.smsId, { reason: actionNote });
      } else if (actionType === 'clarify') {
        await smsAPI.askClarification(selectedSms.smsId, { question: actionNote });
      }

      setShowActionModal(false);
      setActionNote('');
      setSelectedSms(null);
      loadInbox(page);
      loadStats();
    } catch (e) {
      console.error('Action failed', e);
      alert('Failed to process SMS');
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
                        <div className="flex gap-2">
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
    </div>
  );
}
