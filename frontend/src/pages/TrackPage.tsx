import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import { reportAPI } from '../services/api';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import Navbar from '../components/Navbar';

// Fix Leaflet default marker icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MediaItem {
  id: string;
  type: string;
  url: string;
  thumbnailUrl: string | null;
  originalFilename: string | null;
}

interface ReportStatus {
  referenceNumber: string;
  type: string;
  title: string | null;
  description: string;
  status: string;
  priority: string;
  address: string;
  landmark: string | null;
  latitude: number | null;
  longitude: number | null;
  submittedAt: string;
  occurredAt: string | null;
  media?: MediaItem[];
}

export default function TrackPage() {
  const [referenceNumber, setReferenceNumber] = useState('');
  const [report, setReport] = useState<ReportStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!referenceNumber.trim()) return;

    setLoading(true);
    setError('');
    setReport(null);

    try {
      const response = await reportAPI.getStatus(referenceNumber.trim());
      setReport(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Report not found. Please check your reference number.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { color: string; bg: string; border: string; icon: string; label: string; step: number }> = {
      pending:       { color: 'text-amber-700',  bg: 'bg-amber-50',   border: 'border-amber-300',  icon: '⏳', label: 'Pending Review', step: 1 },
      under_review:  { color: 'text-blue-700',   bg: 'bg-blue-50',    border: 'border-blue-300',   icon: '🔍', label: 'Under Review',   step: 2 },
      investigating: { color: 'text-purple-700', bg: 'bg-purple-50',  border: 'border-purple-300', icon: '🕵️', label: 'Investigating',   step: 3 },
      resolved:      { color: 'text-green-700',  bg: 'bg-green-50',   border: 'border-green-300',  icon: '✅', label: 'Resolved',       step: 4 },
      rejected:      { color: 'text-red-700',    bg: 'bg-red-50',     border: 'border-red-300',    icon: '❌', label: 'Rejected',       step: 4 },
    };
    return configs[status] || { color: 'text-gray-700', bg: 'bg-gray-50', border: 'border-gray-300', icon: '📋', label: status, step: 1 };
  };

  const getPriorityConfig = (priority: string) => {
    const configs: Record<string, { color: string; bg: string; dot: string }> = {
      low:    { color: 'text-green-700',  bg: 'bg-green-100',  dot: 'bg-green-500' },
      medium: { color: 'text-amber-700',  bg: 'bg-amber-100',  dot: 'bg-amber-500' },
      high:   { color: 'text-orange-700', bg: 'bg-orange-100', dot: 'bg-orange-500' },
      urgent: { color: 'text-red-700',    bg: 'bg-red-100',    dot: 'bg-red-500' },
    };
    return configs[priority] || { color: 'text-gray-700', bg: 'bg-gray-100', dot: 'bg-gray-500' };
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative overflow-hidden">
      {/* Background decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-[500px] h-[500px] bg-gradient-to-br from-blue-200/20 to-transparent rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-20 -right-20 w-[500px] h-[500px] bg-gradient-to-tl from-indigo-200/20 to-transparent rounded-full filter blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>
      {/* Dot grid */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="track-dots" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="20" cy="20" r="1.5" fill="currentColor" className="text-blue-900"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#track-dots)" />
        </svg>
      </div>

      {/* Header */}
      <Navbar showLinks={false} />

      <div className="container mx-auto px-4 py-12 max-w-4xl relative">
        {/* Hero */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-10"
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-24 h-24 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl relative"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-indigo-400 rounded-3xl filter blur-xl opacity-50 animate-pulse"></div>
            <svg className="w-12 h-12 text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-gray-800 via-blue-800 to-indigo-800 bg-clip-text text-transparent mb-3">Track Your Report</h1>
          <p className="text-gray-500 text-lg max-w-md mx-auto">Enter your reference number to check the status of your report</p>
        </motion.div>

        {/* Search Form */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-3xl shadow-2xl p-6 md:p-8 mb-8 border border-white/30 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-400/10 to-transparent rounded-full filter blur-2xl"></div>
          <div className="relative z-10">
            <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
              </svg>
              Reference Number
            </label>
            <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value.toUpperCase())}
                  placeholder="e.g., CR-MICTLQBR-76B7"
                  className="w-full px-5 py-4 pl-12 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-lg font-mono bg-white shadow-inner hover:border-blue-300 tracking-wider"
                />
                <svg className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {referenceNumber && (
                  <button
                    type="button"
                    onClick={() => setReferenceNumber('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                type="submit"
                disabled={loading || !referenceNumber.trim()}
                className="px-10 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-bold text-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl hover:shadow-2xl flex items-center justify-center gap-2 min-w-[160px]"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Searching...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Track Report
                  </>
                )}
              </motion.button>
            </form>
          </div>
        </motion.div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.97 }}
              className="flex items-start gap-4 bg-red-50 border-2 border-red-200 p-5 rounded-2xl mb-6 shadow-lg"
            >
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-bold text-red-800 mb-1">Report Not Found</p>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
              <button onClick={() => setError('')} className="text-red-400 hover:text-red-600 transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Report Details */}
        <AnimatePresence>
          {report && (
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.4, type: 'spring' }}
              className="space-y-6"
            >
              {/* Status Hero Card */}
              <div className="glass rounded-3xl shadow-2xl overflow-hidden border border-white/20">
                {/* Colored top band based on status */}
                <div className={`h-2 w-full ${
                  report.status === 'resolved' ? 'bg-gradient-to-r from-green-400 to-emerald-500' :
                  report.status === 'rejected' ? 'bg-gradient-to-r from-red-400 to-rose-500' :
                  report.status === 'investigating' ? 'bg-gradient-to-r from-purple-400 to-indigo-500' :
                  report.status === 'under_review' ? 'bg-gradient-to-r from-blue-400 to-cyan-500' :
                  'bg-gradient-to-r from-amber-400 to-orange-400'
                }`}></div>

                <div className="p-6 md:p-8">
                  {/* Reference + Status Row */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Reference Number</p>
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-black text-2xl md:text-3xl bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent tracking-wider">
                          {report.referenceNumber}
                        </span>
                        <button
                          onClick={() => navigator.clipboard.writeText(report.referenceNumber)}
                          className="p-2 bg-blue-50 hover:bg-blue-100 rounded-xl transition text-blue-600"
                          title="Copy"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
                      className={`flex items-center gap-3 px-6 py-3 rounded-2xl border-2 font-bold text-lg shadow-lg ${getStatusConfig(report.status).bg} ${getStatusConfig(report.status).color} ${getStatusConfig(report.status).border}`}
                    >
                      <span className="text-2xl">{getStatusConfig(report.status).icon}</span>
                      {getStatusConfig(report.status).label}
                    </motion.div>
                  </div>

                  {/* Progress Tracker */}
                  <div className="mb-8">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Case Progress</p>
                    <div className="relative">
                      {/* Progress bar */}
                      <div className="absolute top-5 left-5 right-5 h-1 bg-gray-200 rounded-full">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${
                            report.status === 'rejected' ? '100' :
                            ((getStatusConfig(report.status).step - 1) / 3) * 100
                          }%` }}
                          transition={{ duration: 1, ease: 'easeOut', delay: 0.5 }}
                          className={`h-full rounded-full ${
                            report.status === 'resolved' ? 'bg-gradient-to-r from-green-400 to-emerald-500' :
                            report.status === 'rejected' ? 'bg-gradient-to-r from-red-400 to-rose-500' :
                            'bg-gradient-to-r from-blue-500 to-indigo-600'
                          }`}
                        />
                      </div>
                      {/* Steps */}
                      <div className="grid grid-cols-4 relative z-10">
                        {[
                          { label: 'Submitted', icon: '📬', step: 1 },
                          { label: 'Reviewing', icon: '🔍', step: 2 },
                          { label: 'Investigating', icon: '🕵️', step: 3 },
                          { label: report.status === 'rejected' ? 'Rejected' : 'Resolved', icon: report.status === 'rejected' ? '❌' : '✅', step: 4 },
                        ].map((s) => {
                          const active = getStatusConfig(report.status).step >= s.step;
                          const current = getStatusConfig(report.status).step === s.step;
                          return (
                            <div key={s.step} className="flex flex-col items-center gap-2">
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.3 + s.step * 0.1, type: 'spring' }}
                                className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-md border-4 ${
                                  current
                                    ? 'border-blue-500 bg-blue-500 ring-4 ring-blue-200'
                                    : active
                                    ? 'border-green-500 bg-green-500'
                                    : 'border-gray-200 bg-white'
                                }`}
                              >
                                {active ? <span>{s.icon}</span> : <span className="text-gray-300 text-base">○</span>}
                              </motion.div>
                              <p className={`text-xs font-semibold text-center leading-tight ${
                                active ? 'text-gray-700' : 'text-gray-400'
                              }`}>{s.label}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Info Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-2xl border border-blue-100 group hover:shadow-md transition">
                      <p className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-1 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        Category
                      </p>
                      <p className="font-bold text-xl capitalize text-gray-800">{report.type}</p>
                    </div>
                    <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-5 rounded-2xl border border-orange-100 group hover:shadow-md transition">
                      <p className="text-xs font-bold text-orange-600 uppercase tracking-wide mb-2 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        Priority
                      </p>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${getPriorityConfig(report.priority).dot} animate-pulse`}></div>
                        <span className={`font-bold text-lg capitalize px-3 py-1 rounded-lg ${getPriorityConfig(report.priority).bg} ${getPriorityConfig(report.priority).color}`}>
                          {report.priority}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-4">
                    {report.title && (
                      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                        className="bg-white p-5 rounded-2xl border-2 border-purple-100 shadow-sm"
                      >
                        <p className="text-xs font-bold text-purple-600 uppercase tracking-wide mb-2">Title</p>
                        <p className="text-gray-800 text-lg font-bold">{report.title}</p>
                      </motion.div>
                    )}

                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
                      className="bg-white p-5 rounded-2xl border-2 border-gray-100 shadow-sm"
                    >
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Description</p>
                      <p className="text-gray-800 leading-relaxed">{report.description}</p>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
                      className="bg-white p-5 rounded-2xl border-2 border-green-100 shadow-sm"
                    >
                      <p className="text-xs font-bold text-green-600 uppercase tracking-wide mb-2 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Location
                      </p>
                      <p className="text-gray-800 font-semibold">📍 {report.address}</p>
                      {report.landmark && <p className="text-gray-500 text-sm mt-1">🏛️ Near: {report.landmark}</p>}
                    </motion.div>

                    {/* Map */}
                    {report.latitude && report.longitude && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                        <div className="h-64 rounded-2xl overflow-hidden border-2 border-green-200 shadow-lg hover:shadow-xl transition-shadow">
                          <MapContainer
                            center={[report.latitude, report.longitude]}
                            zoom={15}
                            style={{ height: '100%', width: '100%' }}
                            scrollWheelZoom={false}
                          >
                            <TileLayer
                              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            <Marker position={[report.latitude, report.longitude]} />
                          </MapContainer>
                        </div>
                        <p className="mt-2 text-xs text-gray-400 flex items-center gap-1">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                          </svg>
                          {report.latitude.toFixed(6)}, {report.longitude.toFixed(6)}
                        </p>
                      </motion.div>
                    )}

                    {/* Evidence */}
                    {report.media && report.media.length > 0 && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                          </svg>
                          Evidence ({report.media.length} file{report.media.length > 1 ? 's' : ''})
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {report.media.map((item, index) => (
                            <motion.div
                              key={item.id}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 0.1 * index }}
                              className="relative group rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 aspect-square bg-gray-100 border-2 border-gray-100"
                            >
                              {item.type === 'image' ? (
                                <div className="relative w-full h-full">
                                  <img
                                    src={`http://localhost:5000${item.url}`}
                                    alt={item.originalFilename || `Evidence ${index + 1}`}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                    onError={(e) => {
                                      const target = e.currentTarget as HTMLImageElement;
                                      target.style.display = 'none';
                                      const parent = target.parentElement!;
                                      parent.innerHTML = `<div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200"><div class="text-center p-4"><p class="text-xs text-gray-400">Unavailable</p></div></div>`;
                                    }}
                                  />
                                </div>
                              ) : item.type === 'video' ? (
                                <video src={`http://localhost:5000${item.url}`} className="w-full h-full object-cover" controls />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-100">
                                  <div className="text-center">
                                    <svg className="w-12 h-12 mx-auto text-blue-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                    </svg>
                                    <p className="text-xs text-blue-700 font-medium">Audio</p>
                                  </div>
                                </div>
                              )}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <div className="absolute bottom-0 left-0 right-0 p-3">
                                  <p className="text-white text-xs font-medium truncate">{item.originalFilename || `File ${index + 1}`}</p>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="glass rounded-3xl shadow-2xl p-6 md:p-8 border border-white/20"
              >
                <h3 className="text-xl font-extrabold text-gray-800 mb-6 flex items-center gap-3">
                  <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  Case Timeline
                </h3>

                <div className="relative">
                  <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-400 via-indigo-300 to-gray-200"></div>
                  <div className="space-y-6">
                    {/* Submitted */}
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}
                      className="relative flex items-start gap-4"
                    >
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg z-10 text-lg">
                        📬
                      </div>
                      <div className="flex-1 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-2xl border border-blue-100 shadow-sm">
                        <p className="font-bold text-gray-800">Report Submitted</p>
                        <p className="text-sm text-gray-500 mt-1">{formatDate(report.submittedAt)}</p>
                        <p className="text-xs text-blue-600 mt-1 font-medium">Your report was received by the system</p>
                      </div>
                    </motion.div>

                    {report.occurredAt && (
                      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.55 }}
                        className="relative flex items-start gap-4"
                      >
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full flex items-center justify-center shadow-lg z-10 text-lg">
                          🕐
                        </div>
                        <div className="flex-1 bg-gradient-to-r from-orange-50 to-amber-50 p-4 rounded-2xl border border-orange-100 shadow-sm">
                          <p className="font-bold text-gray-800">Incident Occurred</p>
                          <p className="text-sm text-gray-500 mt-1">{formatDate(report.occurredAt)}</p>
                        </div>
                      </motion.div>
                    )}

                    {report.status !== 'pending' && (
                      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }}
                        className="relative flex items-start gap-4"
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg z-10 text-lg ${
                          report.status === 'resolved' ? 'bg-gradient-to-br from-green-500 to-emerald-600' :
                          report.status === 'rejected' ? 'bg-gradient-to-br from-red-500 to-rose-600' :
                          'bg-gradient-to-br from-purple-500 to-indigo-600'
                        }`}>
                          {getStatusConfig(report.status).icon}
                        </div>
                        <div className={`flex-1 p-4 rounded-2xl border shadow-sm ${
                          report.status === 'resolved' ? 'bg-green-50 border-green-100' :
                          report.status === 'rejected' ? 'bg-red-50 border-red-100' :
                          'bg-purple-50 border-purple-100'
                        }`}>
                          <p className="font-bold text-gray-800 capitalize">Status: {report.status.replace('_', ' ')}</p>
                          <p className="text-xs font-medium mt-1 opacity-70">
                            {report.status === 'resolved' ? 'This case has been closed' :
                             report.status === 'rejected' ? 'This report was not accepted' :
                             'Officers are actively working on your case'}
                          </p>
                        </div>
                      </motion.div>
                    )}

                    {report.status !== 'resolved' && report.status !== 'rejected' && (
                      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.65 }}
                        className="relative flex items-start gap-4 opacity-40"
                      >
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center z-10 text-lg border-2 border-dashed border-gray-300">
                          ⏳
                        </div>
                        <div className="flex-1 bg-gray-50 p-4 rounded-2xl border border-gray-200">
                          <p className="font-bold text-gray-600">Awaiting Resolution</p>
                          <p className="text-xs text-gray-400 mt-1">We're actively working on your case</p>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Note */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="flex items-start gap-4 bg-amber-50 border-2 border-amber-200 p-5 rounded-2xl shadow-sm"
              >
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-sm text-amber-800">
                  <span className="font-bold">Keep your reference number safe.</span> You'll need it every time you want to check updates on your report.
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Help Section */}
        {!report && !error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass rounded-3xl shadow-xl p-8 border border-white/20 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-400/5 to-transparent rounded-full filter blur-3xl"></div>
            <div className="text-center mb-8">
              <div className="text-6xl mb-3">🔍</div>
              <h3 className="text-2xl font-extrabold text-gray-800 mb-2">How to Track Your Report</h3>
              <p className="text-gray-500 text-sm">Follow these simple steps to check your case status</p>
            </div>
            <div className="grid md:grid-cols-3 gap-5 max-w-2xl mx-auto">
              {[
                { num: '1', icon: '📋', title: 'Find Your Number', desc: 'Locate the reference number from your report confirmation (e.g., CR-XXXX-XXXX)' },
                { num: '2', icon: '🔎', title: 'Enter & Search', desc: 'Type or paste your reference number in the search box above and click Track' },
                { num: '3', icon: '🔄', title: 'Check Updates', desc: 'View your case status anytime — come back to track new developments' },
              ].map((step) => (
                <motion.div
                  key={step.num}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + parseInt(step.num) * 0.1 }}
                  className="bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-all text-center group card-hover border border-gray-100"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-lg mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform">
                    {step.num}
                  </div>
                  <div className="text-3xl mb-3">{step.icon}</div>
                  <h4 className="font-bold text-gray-800 mb-2">{step.title}</h4>
                  <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
                </motion.div>
              ))}
            </div>

            {/* Quick action */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-8 text-center"
            >
              <p className="text-gray-500 text-sm mb-4">Don't have a report yet?</p>
              <Link
                to="/report"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-2xl font-bold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl hover:scale-105"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Submit a New Report
              </Link>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
