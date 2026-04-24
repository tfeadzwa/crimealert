import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import { reportAPI } from '../services/api';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

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
  const { t } = useTranslation();
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

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      under_review: 'bg-blue-100 text-blue-800 border-blue-200',
      investigating: 'bg-purple-100 text-purple-800 border-purple-200',
      resolved: 'bg-green-100 text-green-800 border-green-200',
      rejected: 'bg-red-100 text-red-800 border-red-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800',
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header with enhanced styling */}
      <header className="bg-white/80 backdrop-blur-md shadow-lg border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-5">
          <div className="flex items-center justify-between">
            <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent hover:scale-105 transition-transform">
              {t('appName')}
            </Link>
            <Link to="/" className="text-sm text-gray-600 hover:text-blue-600 transition-colors font-medium">
              ← Back to Home
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-10"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl"
          >
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </motion.div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-gray-800 via-blue-800 to-indigo-800 bg-clip-text text-transparent mb-4">Track Your Report</h1>
          <p className="text-gray-600 text-lg">Enter your reference number to check the status of your report</p>
        </motion.div>

        {/* Enhanced Search Form */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 mb-8 border border-gray-200"
        >
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <input
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="e.g., CR-MICTLQBR-76B7"
                className="w-full px-6 py-4 pl-12 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition text-lg bg-white shadow-inner"
              />
              <svg className="w-6 h-6 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
              </svg>
            </div>
            <button
              type="submit"
              disabled={loading || !referenceNumber.trim()}
              className="px-10 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-bold text-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl hover:shadow-2xl hover:scale-105 disabled:hover:scale-100"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Searching...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  🔍 Track Report
                </span>
              )}
            </button>
          </form>
        </motion.div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg mb-6"
            >
              <p className="text-red-800">❌ {error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Report Details */}
        <AnimatePresence>
          {report && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-6"
            >
              {/* Enhanced Status Card */}
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-gray-200">
                <div className="flex items-start justify-between mb-8">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">Report Status</h2>
                        <p className="text-gray-500 text-sm mt-1">Track your case progress</p>
                      </div>
                    </div>
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                      <p className="text-sm text-gray-600 mb-1">Reference Number</p>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xl text-blue-600">{report.referenceNumber}</span>
                        <button
                          onClick={() => navigator.clipboard.writeText(report.referenceNumber)}
                          className="p-2 hover:bg-blue-100 rounded-lg transition"
                          title="Copy to clipboard"
                        >
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                    className={`px-6 py-3 rounded-2xl font-bold border-2 shadow-lg ${getStatusColor(report.status)}`}
                  >
                    {report.status.replace('_', ' ').toUpperCase()}
                  </motion.div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-200 shadow-md hover:shadow-lg transition">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                      </div>
                      <p className="text-sm text-blue-700 font-medium">Category</p>
                    </div>
                    <p className="font-bold text-2xl capitalize text-gray-800">{report.type}</p>
                  </div>
                  <div className="bg-gradient-to-br from-orange-50 to-red-50 p-6 rounded-2xl border border-orange-200 shadow-md hover:shadow-lg transition">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                      <p className="text-sm text-orange-700 font-medium">Priority Level</p>
                    </div>
                    <span className={`inline-block px-4 py-2 rounded-xl font-bold text-lg capitalize ${getPriorityColor(report.priority)} shadow-sm`}>
                      {report.priority}
                    </span>
                  </div>
                </div>

                <div className="space-y-6">
                  {report.title && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-2xl border border-purple-200"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                        </svg>
                        <p className="text-sm text-purple-700 font-bold uppercase tracking-wide">Title</p>
                      </div>
                      <p className="text-gray-800 text-xl font-bold">{report.title}</p>
                    </motion.div>
                  )}

                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 rounded-2xl border border-gray-200"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                      </svg>
                      <p className="text-sm text-gray-700 font-bold uppercase tracking-wide">Description</p>
                    </div>
                    <p className="text-gray-800 text-lg leading-relaxed">{report.description}</p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-2xl border border-green-200"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <p className="text-sm text-green-700 font-bold uppercase tracking-wide">Location</p>
                    </div>
                    <p className="text-gray-800 text-lg font-medium">
                      📍 {report.address}
                    </p>
                    {report.landmark && (
                      <p className="text-gray-600 text-base mt-2 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                        Near: {report.landmark}
                      </p>
                    )}
                  </motion.div>

                  {/* Map - only if coordinates are available */}
                  {report.latitude && report.longitude && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Location on Map</p>
                      <div className="h-64 rounded-xl overflow-hidden border-2 border-gray-200">
                        <MapContainer
                          center={[report.latitude, report.longitude]}
                          zoom={15}
                          style={{ height: '100%', width: '100%' }}
                          scrollWheelZoom={false}
                        >
                          <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          />
                          <Marker position={[report.latitude, report.longitude]} />
                        </MapContainer>
                      </div>
                      <p className="mt-2 text-xs text-gray-500">
                        Coordinates: {report.latitude.toFixed(6)}, {report.longitude.toFixed(6)}
                      </p>
                    </div>
                  )}

                  {/* Evidence/Media - only if media exists */}
                  {report.media && report.media.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-600 mb-3 font-medium">📎 Attached Evidence ({report.media.length})</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {report.media.map((item, index) => (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.1 * index }}
                            className="relative group rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 aspect-square bg-gray-100"
                          >
                            {item.type === 'image' ? (
                              <div className="relative w-full h-full">
                                <img
                                  src={`http://localhost:5000${item.url}`}
                                  alt={item.originalFilename || `Evidence ${index + 1}`}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                  onError={(e) => {
                                    console.error('Image failed to load:', `http://localhost:5000${item.url}`);
                                    const target = e.currentTarget as HTMLImageElement;
                                    target.style.display = 'none';
                                    const parent = target.parentElement!;
                                    parent.innerHTML = `
                                      <div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                                        <div class="text-center p-4">
                                          <svg class="w-8 h-8 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                                          </svg>
                                          <p class="text-xs text-gray-500 font-medium">Image unavailable</p>
                                          <p class="text-xs text-gray-400 mt-1">${item.originalFilename || 'File'}</p>
                                        </div>
                                      </div>
                                    `;
                                  }}
                                  onLoad={() => console.log('Image loaded successfully:', `http://localhost:5000${item.url}`)}
                                />
                              </div>
                            ) : item.type === 'video' ? (
                              <video
                                src={`http://localhost:5000${item.url}`}
                                className="w-full h-full object-cover"
                                controls
                              />
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
                                <p className="text-white text-xs font-medium truncate">
                                  {item.originalFilename || `File ${index + 1}`}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Timeline */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-2xl shadow-xl p-8"
              >
                <h3 className="text-xl font-bold text-gray-800 mb-6">Timeline</h3>
                
                <div className="relative space-y-6">
                  {/* Timeline line */}
                  <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200"></div>

                  {/* Submitted */}
                  <div className="relative flex items-start gap-4">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.4 }}
                      className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg z-10"
                    >
                      ✓
                    </motion.div>
                    <div className="flex-1 bg-gray-50 p-4 rounded-xl">
                      <p className="font-semibold text-gray-800">Report Submitted</p>
                      <p className="text-sm text-gray-600">{formatDate(report.submittedAt)}</p>
                    </div>
                  </div>

                  {/* Current Status */}
                  {report.status !== 'pending' && (
                    <div className="relative flex items-start gap-4">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.5 }}
                        className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg z-10"
                      >
                        ⚡
                      </motion.div>
                      <div className="flex-1 bg-gray-50 p-4 rounded-xl">
                        <p className="font-semibold text-gray-800 capitalize">Status: {report.status.replace('_', ' ')}</p>
                        <p className="text-sm text-gray-600">In progress</p>
                      </div>
                    </div>
                  )}

                  {/* Future Status */}
                  {report.status !== 'resolved' && report.status !== 'rejected' && (
                    <div className="relative flex items-start gap-4 opacity-50">
                      <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-white font-bold z-10">
                        ○
                      </div>
                      <div className="flex-1 bg-gray-50 p-4 rounded-xl">
                        <p className="font-semibold text-gray-800">Resolution Pending</p>
                        <p className="text-sm text-gray-600">We're working on your case</p>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Info Box */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-lg"
              >
                <p className="text-sm text-blue-800">
                  <strong>ℹ️ Note:</strong> Keep your reference number safe. You'll need it to track updates on your report.
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Help Section */}
        {!report && !error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl shadow-lg p-8 text-center"
          >
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">How to Track Your Report</h3>
            <div className="text-left max-w-md mx-auto space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-2xl">1️⃣</span>
                <p className="text-gray-600">Enter the reference number you received when submitting your report</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">2️⃣</span>
                <p className="text-gray-600">Click the Track button to view your report status</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">3️⃣</span>
                <p className="text-gray-600">Check back anytime to see updates on your case</p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
