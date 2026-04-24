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
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                📱 SMS Inbox
              </h1>
              <p className="text-gray-600 mt-1">Review and manage citizen SMS reports</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">Officer</p>
                <p className="font-semibold">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Navigation */}
          <div className="mt-4 flex gap-4 text-sm border-b border-gray-200 -mx-4 px-4">
            <Link
              to="/dashboard"
              className="py-2 px-4 text-gray-600 hover:text-blue-600 transition"
            >
              All Reports
            </Link>
            <button
              onClick={() => {}}
              className="py-2 px-4 border-b-2 border-blue-600 text-blue-600 font-medium"
            >
              📱 SMS Inbox
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
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
