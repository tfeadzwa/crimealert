import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { reportAPI } from '../services/api';
import { authService } from '../services/auth';

interface DashboardStats {
  total: number;
  pending: number;
  under_review: number;
  investigating: number;
  resolved: number;
}

interface Report {
  id: string;
  referenceNumber: string;
  type: string;
  description: string;
  status: string;
  priority: string;
  address: string;
  createdAt: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [filter, setFilter] = useState<string>('all');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const navigate = useNavigate();
  const user = authService.getUser();

  useEffect(() => {
    fetchDashboardData();
  }, [filter]);

  const handleLogout = () => {
    authService.logout();
    navigate('/');
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const [statsRes, reportsRes] = await Promise.all([
        reportAPI.getStats(),
        reportAPI.getAll({ status: filter === 'all' ? undefined : filter })
      ]);
      
      setStats(statsRes.data);
      setReports(reportsRes.data.reports || []);
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setError(err.response?.data?.message || 'Failed to load dashboard data. Please check if the backend server is running.');
      // Set empty defaults
      setStats({ total: 0, pending: 0, under_review: 0, investigating: 0, resolved: 0 });
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (reportId: string, newStatus: string, newPriority?: string) => {
    try {
      await reportAPI.updateStatus(reportId, { status: newStatus, priority: newPriority });
      setShowUpdateModal(false);
      fetchDashboardData();
    } catch (error) {
      console.error('Error updating report:', error);
      alert('Failed to update report');
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-500',
      under_review: 'bg-blue-500',
      investigating: 'bg-purple-500',
      resolved: 'bg-green-500',
      rejected: 'bg-red-500',
    };
    return colors[status] || 'bg-gray-500';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: 'bg-green-500',
      medium: 'bg-yellow-500',
      high: 'bg-orange-500',
      urgent: 'bg-red-600',
    };
    return colors[priority] || 'bg-gray-500';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
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
                  Police Dashboard
                </h1>
                <p className="text-xs text-gray-500 mt-0.5">Crime Alert Management System</p>
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
            <button
              className="flex-shrink-0 flex items-center gap-2 py-2.5 px-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold text-sm shadow-lg"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              All Reports
            </button>
            <Link
              to="/sms-inbox"
              className="flex-shrink-0 flex items-center gap-2 py-2.5 px-5 bg-white text-gray-700 hover:text-blue-600 rounded-xl font-semibold text-sm transition border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              SMS Inbox
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border-l-4 border-red-500 p-5 rounded-xl mb-6 shadow-lg"
          >
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-red-800 font-medium">{error}</p>
            </div>
          </motion.div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6 mb-8">
          {stats && Object.entries(stats).map(([key, value], index) => {
            const colors = {
              total: 'from-blue-500 to-blue-700',
              pending: 'from-yellow-500 to-orange-500',
              under_review: 'from-indigo-500 to-purple-600',
              investigating: 'from-purple-500 to-pink-600',
              resolved: 'from-green-500 to-emerald-600'
            };
            const icons = {
              total: '📋',
              pending: '⏳',
              under_review: '👁️',
              investigating: '🔍',
              resolved: '✅'
            };
            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: index * 0.1, type: 'spring' }}
                className="glass rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all card-hover backdrop-blur-xl border border-white/30"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-12 h-12 bg-gradient-to-br ${colors[key as keyof typeof colors]} rounded-xl flex items-center justify-center text-2xl shadow-lg`}>
                    {icons[key as keyof typeof icons]}
                  </div>
                </div>
                <p className="text-gray-600 text-sm mb-1 capitalize font-medium">{key.replace('_', ' ')}</p>
                <motion.p
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.1 + 0.2, type: 'spring', stiffness: 200 }}
                  className="text-4xl font-extrabold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent"
                >
                  {value}
                </motion.p>
              </motion.div>
            );
          })}
        </div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass rounded-2xl shadow-xl p-6 mb-8 backdrop-blur-xl border border-white/30"
        >
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filter Reports
          </h3>
          <div className="flex flex-wrap gap-3">
            {['all', 'pending', 'under_review', 'investigating', 'resolved'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-6 py-3 rounded-xl font-bold transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 ${
                  filter === status
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xl scale-105'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200'
                }`}
              >
                {status.replace('_', ' ').toUpperCase()}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Reports Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass rounded-3xl shadow-2xl overflow-hidden backdrop-blur-xl border border-white/30"
        >
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-1">Crime Reports</h2>
                <p className="text-blue-100">Showing {reports.length} {filter !== 'all' ? filter.replace('_', ' ') : ''} reports</p>
              </div>
              <div className="text-4xl">📊</div>
            </div>
          </div>

          {loading ? (
            <div className="p-16 text-center bg-white">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mb-4"></div>
              <p className="text-gray-600 font-medium">Loading reports...</p>
            </div>
          ) : reports.length === 0 ? (
            <div className="p-16 text-center bg-white">
              <div className="text-7xl mb-4">📋</div>
              <p className="text-gray-600 text-lg font-medium">No reports found</p>
              <p className="text-gray-400 text-sm mt-2">Try adjusting your filters or check back later</p>
            </div>
          ) : (
            <div className="overflow-x-auto bg-white">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-blue-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Reference</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Location</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Priority</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <AnimatePresence>
                    {reports.map((report, index) => (
                      <motion.tr
                        key={report.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all"
                      >
                        <td className="px-6 py-4">
                          <p className="font-mono text-sm font-bold text-blue-600">{report.referenceNumber}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg">
                            <span className="text-lg">
                              {report.type === 'theft' && '🎒'}
                              {report.type === 'assault' && '👊'}
                              {report.type === 'vandalism' && '💥'}
                              {report.type === 'burglary' && '🏠'}
                              {report.type === 'robbery' && '💰'}
                              {report.type === 'fraud' && '💳'}
                              {!['theft', 'assault', 'vandalism', 'burglary', 'robbery', 'fraud'].includes(report.type) && '📋'}
                            </span>
                            <span className="capitalize font-semibold text-gray-700">{report.type}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <p className="text-sm text-gray-600 truncate max-w-xs">{report.address}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md ${getStatusColor(report.status)}`}>
                            <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                            {report.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-3 py-2 rounded-xl text-xs font-bold text-white capitalize shadow-md ${getPriorityColor(report.priority)}`}>
                            {report.priority === 'urgent' && '🔴'}
                            {report.priority === 'high' && '🟠'}
                            {report.priority === 'medium' && '🟡'}
                            {report.priority === 'low' && '🟢'}
                            {' '}{report.priority}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-600 font-medium">
                            {new Date(report.createdAt).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(report.createdAt).toLocaleTimeString('en-US', { 
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => {
                              setSelectedReport(report);
                              setShowUpdateModal(true);
                            }}
                            className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                          >
                            Manage
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>

      {/* Update Modal */}
      <AnimatePresence>
        {showUpdateModal && selectedReport && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowUpdateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full"
            >
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Update Report</h3>
              <p className="text-gray-600 mb-6 font-mono text-sm">{selectedReport.referenceNumber}</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    id="status"
                    defaultValue={selectedReport.status}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="pending">Pending</option>
                    <option value="under_review">Under Review</option>
                    <option value="investigating">Investigating</option>
                    <option value="resolved">Resolved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                  <select
                    id="priority"
                    defaultValue={selectedReport.priority}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowUpdateModal(false)}
                    className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      const newStatus = (document.getElementById('status') as HTMLSelectElement).value;
                      const newPriority = (document.getElementById('priority') as HTMLSelectElement).value;
                      handleUpdateStatus(selectedReport.id, newStatus, newPriority);
                    }}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition shadow-lg"
                  >
                    Update
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
