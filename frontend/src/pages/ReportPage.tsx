import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import { motion, AnimatePresence } from 'framer-motion';
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

interface FormData {
  category: string;
  title: string;
  description: string;
  location: string;
  landmark: string;
  latitude: number | null;
  longitude: number | null;
  occurredAt: string;
}

// Component to handle map click and recenter
function MapController({ center, position, setPosition, setFormData, formData }: any) {
  const map = useMap();

  useEffect(() => {
    if (center) {
      map.setView([center.lat, center.lng], 15);
    }
  }, [center, map]);

  useEffect(() => {
    const onClick = (e: L.LeafletMouseEvent) => {
      const newPos = { lat: e.latlng.lat, lng: e.latlng.lng };
      setPosition(newPos);
      setFormData({ 
        ...formData, 
        latitude: e.latlng.lat, 
        longitude: e.latlng.lng 
      });
    };

    map.on('click', onClick);
    return () => {
      map.off('click', onClick);
    };
  }, [map, setPosition, setFormData, formData]);

  return position ? <Marker position={[position.lat, position.lng]} /> : null;
}

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'warning';
}

export default function ReportPage() {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [mapPosition, setMapPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({ lat: -17.8252, lng: 31.0335 }); // Default: Harare
  const [gettingLocation, setGettingLocation] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (message: string, type: Toast['type'] = 'error') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  };

  const dismissToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Get user's current location when component mounts
  useEffect(() => {
    if ('geolocation' in navigator) {
      setGettingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setMapCenter(userLocation);
          setMapPosition(userLocation);
          setFormData(prev => ({ 
            ...prev, 
            latitude: position.coords.latitude, 
            longitude: position.coords.longitude 
          }));
          setGettingLocation(false);
        },
        (error) => {
          console.log('Geolocation error:', error.message);
          setGettingLocation(false);
          // Keep default Harare location
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, []);

  const [formData, setFormData] = useState<FormData>({
    category: '',
    title: '',
    description: '',
    location: '',
    landmark: '',
    latitude: null,
    longitude: null,
    occurredAt: ''
  });

  const [submitted, setSubmitted] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...newFiles].slice(0, 5)); // Max 5 files
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Create report
      const reportData = {
        type: formData.category,
        title: formData.title,
        description: formData.description,
        address: formData.location,
        landmark: formData.landmark || null,
        latitude: formData.latitude,
        longitude: formData.longitude,
        occurredAt: formData.occurredAt || null,
        isAnonymous: true,
        originalLanguage: 'en'
      };

      const response = await reportAPI.create(reportData);
      
      console.log('Report created response:', response);
      console.log('Report ID:', response.data?.id);
      console.log('Files to upload:', files.length);
      
      // Upload files if any
      if (files.length > 0 && response.data?.id) {
        try {
          console.log('Uploading files for report:', response.data.id);
          await reportAPI.uploadMedia(response.data.id, files);
          console.log('Files uploaded successfully');
        } catch (uploadError: any) {
          console.error('Error uploading files:', uploadError);
          console.error('Upload error details:', uploadError.response?.data);
          // Don't fail the entire submission if file upload fails
          showToast('Report submitted! Some files failed to upload — check your reference number below.', 'warning');
        }
      }

      setReferenceNumber(response.data?.referenceNumber || '');
      setSubmitted(true);
    } catch (error: any) {
      console.error('Error submitting report:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to submit report. Please try again.';
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (currentStep < 3) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const canProceed = () => {
    if (currentStep === 1) {
      return formData.category && formData.description;
    }
    if (currentStep === 2) {
      return formData.location;
    }
    return true;
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-green-300/20 to-transparent rounded-full filter blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-emerald-300/20 to-transparent rounded-full filter blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
          {/* Confetti dots */}
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: -20, x: Math.random() * window.innerWidth }}
              animate={{ opacity: [0, 1, 0], y: window.innerHeight + 20 }}
              transition={{ duration: 3 + Math.random() * 2, delay: i * 0.2, repeat: Infinity, repeatDelay: 4 }}
              className="absolute w-3 h-3 rounded-full"
              style={{
                background: ['#10b981','#3b82f6','#8b5cf6','#f59e0b','#ef4444','#06b6d4'][i % 6],
                left: `${(i * 8) + 2}%`,
                top: '-10px'
              }}
            />
          ))}
        </div>

        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ duration: 0.6, type: 'spring', bounce: 0.3 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
        >
          {/* Green header band */}
          <div className="bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 p-8 text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="success-dots" width="20" height="20" patternUnits="userSpaceOnUse">
                    <circle cx="10" cy="10" r="1" fill="white" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#success-dots)" />
              </svg>
            </div>
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
              className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white/40 shadow-2xl relative z-10"
            >
              <svg className="w-14 h-14 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-3xl font-extrabold text-white mb-2 relative z-10"
            >
              Report Submitted!
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-green-100 text-sm relative z-10"
            >
              Your report has been securely received
            </motion.p>
          </div>

          {/* Content */}
          <div className="p-8">
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="text-gray-600 text-center mb-6 text-sm leading-relaxed"
            >
              Save your reference number below to track the progress of your report at any time.
            </motion.p>

            {/* Reference Number Card */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, type: 'spring' }}
              className="relative bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl p-1 mb-6 shadow-xl"
            >
              <div className="bg-white rounded-xl p-6 text-center">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">
                  Reference Number
                </p>
                <div className="bg-gradient-to-br from-slate-50 to-blue-50 border-2 border-blue-100 rounded-xl p-4 mb-4">
                  <p className="text-2xl md:text-3xl font-black tracking-wider bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent select-all">
                    {referenceNumber}
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    navigator.clipboard.writeText(referenceNumber);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2500);
                  }}
                  className={`w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-md ${
                    copied
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                      : 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600'
                  }`}
                >
                  <AnimatePresence mode="wait">
                    {copied ? (
                      <motion.span
                        key="copied"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        Copied!
                      </motion.span>
                    ) : (
                      <motion.span
                        key="copy"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copy Reference Number
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              </div>
            </motion.div>

            {/* What's next steps */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl p-4 mb-6 border border-blue-100"
            >
              <p className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                What happens next?
              </p>
              <div className="space-y-2">
                {[
                  { icon: '🔍', text: 'Police officers will review your report' },
                  { icon: '📞', text: 'Investigations may be started based on your report' },
                  { icon: '📊', text: 'Track the status using your reference number' },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.9 + i * 0.1 }}
                    className="flex items-center gap-3 text-sm text-gray-600"
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span>{item.text}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0 }}
              className="flex gap-3"
            >
              <Link
                to="/track"
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 rounded-xl font-bold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg text-center flex items-center justify-center gap-2 hover:shadow-xl hover:scale-105"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Track Report
              </Link>
              <Link
                to="/"
                className="flex-1 bg-white border-2 border-gray-200 text-gray-700 px-6 py-4 rounded-xl font-bold hover:bg-gray-50 hover:border-gray-300 transition-all text-center flex items-center justify-center gap-2 hover:scale-105"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Go Home
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative overflow-hidden">
      {/* Toast Notifications */}
      <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 80, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 80, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className={`pointer-events-auto flex items-start gap-4 p-4 rounded-2xl shadow-2xl border backdrop-blur-md ${
                toast.type === 'error'
                  ? 'bg-red-50/95 border-red-200 text-red-800'
                  : toast.type === 'warning'
                  ? 'bg-amber-50/95 border-amber-200 text-amber-800'
                  : 'bg-green-50/95 border-green-200 text-green-800'
              }`}
            >
              <div className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${
                toast.type === 'error'
                  ? 'bg-red-100'
                  : toast.type === 'warning'
                  ? 'bg-amber-100'
                  : 'bg-green-100'
              }`}>
                {toast.type === 'error' && (
                  <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                )}
                {toast.type === 'warning' && (
                  <svg className="w-5 h-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                )}
                {toast.type === 'success' && (
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold mb-0.5">
                  {toast.type === 'error' ? 'Error' : toast.type === 'warning' ? 'Notice' : 'Success'}
                </p>
                <p className="text-sm leading-snug opacity-90">{toast.message}</p>
              </div>
              <button
                onClick={() => dismissToast(toast.id)}
                className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                  toast.type === 'error'
                    ? 'hover:bg-red-200 text-red-500'
                    : toast.type === 'warning'
                    ? 'hover:bg-amber-200 text-amber-600'
                    : 'hover:bg-green-200 text-green-600'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Background Pattern */}
      <div className="fixed inset-0 opacity-5 pointer-events-none">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="report-pattern" width="60" height="60" patternUnits="userSpaceOnUse">
              <circle cx="30" cy="30" r="1.5" fill="currentColor" className="text-blue-600"/>
              <circle cx="0" cy="0" r="1" fill="currentColor" className="text-indigo-600"/>
              <circle cx="60" cy="60" r="1" fill="currentColor" className="text-indigo-600"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#report-pattern)" />
        </svg>
      </div>

      {/* Decorative gradient orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 -left-20 w-96 h-96 bg-gradient-to-br from-blue-200/30 to-transparent rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 -right-20 w-96 h-96 bg-gradient-to-tl from-indigo-200/30 to-transparent rounded-full filter blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>

      {/* Header */}
      <Navbar showLinks={false} />

      <div className="container mx-auto px-4 py-10 max-w-4xl relative">
        {/* Progress Steps - Enhanced Design */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          {/* Step indicator cards */}
          <div className="max-w-3xl mx-auto mb-6">
            <div className="grid grid-cols-3 gap-4">
              {[
                { num: 1, icon: '📝', title: 'Details', desc: 'What happened' },
                { num: 2, icon: '📍', title: 'Location', desc: 'Where it occurred' },
                { num: 3, icon: '📎', title: 'Evidence', desc: 'Optional files' }
              ].map((step) => (
                <motion.div
                  key={step.num}
                  initial={false}
                  animate={{
                    scale: currentStep === step.num ? 1.05 : 1,
                  }}
                  className={`relative p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                    currentStep === step.num
                      ? 'bg-gradient-to-br from-blue-600 to-indigo-600 border-blue-600 text-white shadow-2xl'
                      : currentStep > step.num
                      ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-500 text-green-700'
                      : 'bg-white border-gray-200 text-gray-400'
                  }`}
                >
                  {/* Completion check mark */}
                  {currentStep > step.num && (
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg z-10"
                    >
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </motion.div>
                  )}
                  
                  <div className="text-center">
                    <div className={`text-3xl mb-2 ${
                      currentStep === step.num ? 'animate-bounce' : ''
                    }`}>
                      {step.icon}
                    </div>
                    <div className={`text-sm font-bold mb-1 ${
                      currentStep >= step.num && currentStep !== step.num ? 'text-green-700' : ''
                    }`}>
                      {step.title}
                    </div>
                    <div className={`text-xs ${
                      currentStep === step.num 
                        ? 'text-blue-100' 
                        : currentStep > step.num
                        ? 'text-green-600'
                        : 'text-gray-400'
                    }`}>
                      {step.desc}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Progress bar */}
          <div className="max-w-3xl mx-auto">
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden shadow-inner">
              <motion.div
                initial={{ width: '0%' }}
                animate={{ 
                  width: `${((currentStep - 1) / 2) * 100}%`,
                  background: currentStep === 3 
                    ? 'linear-gradient(to right, #10b981, #059669)'
                    : 'linear-gradient(to right, #2563eb, #4f46e5)'
                }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="h-full rounded-full shadow-lg"
              />
            </div>
            <div className="flex justify-between mt-2 px-2">
              <span className="text-xs font-semibold text-gray-600">
                {currentStep === 1 ? 'Just started' : currentStep === 2 ? 'Halfway there' : 'Almost done!'}
              </span>
              <span className="text-xs font-semibold text-gray-600">
                Step {currentStep} of 3
              </span>
            </div>
          </div>
        </motion.div>

        {/* Form Steps */}
        <motion.div
          key={currentStep}
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -50, opacity: 0 }}
          className="glass rounded-3xl shadow-2xl p-8 md:p-10 backdrop-blur-xl border border-white/20 relative overflow-hidden"
        >
          {/* Decorative corner elements */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-400/10 to-transparent rounded-full filter blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-indigo-400/10 to-transparent rounded-full filter blur-2xl"></div>
          
          {/* Content wrapper for z-index */}
          <div className="relative z-10">
          <AnimatePresence mode="wait">
            {/* Step 1: Report Details */}
            {currentStep === 1 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                        Report Details
                      </h2>
                      <p className="text-sm text-gray-500">Step 1 of 3</p>
                    </div>
                  </div>
                  <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-xl">
                    <p className="text-sm text-blue-800 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <span className="font-medium">Your identity is completely protected. All reports are anonymous.</span>
                    </p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    Crime Category *
                  </label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white text-gray-900 font-medium shadow-sm hover:border-blue-300 cursor-pointer"
                  >
                    <option value="">Select a category...</option>
                    <option value="theft">🎒 {t('categories.theft')}</option>
                    <option value="assault">👊 {t('categories.assault')}</option>
                    <option value="vandalism">💥 {t('categories.vandalism')}</option>
                    <option value="burglary">🏠 {t('categories.burglary')}</option>
                    <option value="robbery">💰 {t('categories.robbery')}</option>
                    <option value="fraud">💳 {t('categories.fraud')}</option>
                    <option value="other">📋 {t('categories.other')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                    Title <span className="text-gray-400 text-xs">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Brief summary of the incident..."
                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white shadow-sm hover:border-blue-300"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Description *
                  </label>
                  <textarea
                    required
                    rows={6}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe what happened in detail... Include any important information that could help."
                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white resize-none shadow-sm hover:border-blue-300"
                  />
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      Be as detailed as possible
                    </p>
                    <p className={`text-xs font-semibold ${
                      formData.description.length > 50 ? 'text-green-600' : 'text-gray-400'
                    }`}>
                      {formData.description.length} characters
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    When did this occur? <span className="text-gray-400 text-xs">(optional)</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.occurredAt}
                    onChange={(e) => setFormData({ ...formData, occurredAt: e.target.value })}
                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white shadow-sm hover:border-blue-300"
                  />
                </div>
              </motion.div>
            )}

            {/* Step 2: Location */}
            {currentStep === 2 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                        Location
                      </h2>
                      <p className="text-sm text-gray-500">Step 2 of 3</p>
                    </div>
                  </div>
                  <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-xl">
                    <p className="text-sm text-green-800 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                      <span className="font-medium">Provide as much location detail as possible to help authorities respond.</span>
                    </p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Address or Description *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g., Harare CBD, near Fourth Street"
                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all bg-white shadow-sm hover:border-green-300"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    Nearby Landmark <span className="text-gray-400 text-xs">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.landmark}
                    onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                    placeholder="e.g., Near City Hall, Behind Central Market"
                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all bg-white shadow-sm hover:border-green-300"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                      Pinpoint on map <span className="text-gray-400 text-xs">(optional)</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        if ('geolocation' in navigator) {
                          setGettingLocation(true);
                          navigator.geolocation.getCurrentPosition(
                            (position) => {
                              const userLocation = {
                                lat: position.coords.latitude,
                                lng: position.coords.longitude
                              };
                              setMapCenter(userLocation);
                              setMapPosition(userLocation);
                              setFormData({ 
                                ...formData, 
                                latitude: position.coords.latitude, 
                                longitude: position.coords.longitude 
                              });
                              setGettingLocation(false);
                            },
                            (error) => {
                              alert('Could not get your location: ' + error.message);
                              setGettingLocation(false);
                            },
                            { enableHighAccuracy: true, timeout: 10000 }
                          );
                        } else {
                          alert('Geolocation is not supported by your browser');
                        }
                      }}
                      disabled={gettingLocation}
                      className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg text-sm font-bold hover:from-green-600 hover:to-emerald-700 transition-all shadow-md disabled:opacity-50 flex items-center gap-2"
                    >
                      {gettingLocation ? (
                        <>
                          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Getting...
                        </>
                      ) : (
                        <>
                          📍 Use My Location
                        </>
                      )}
                    </button>
                  </div>
                  <div className="h-80 rounded-2xl overflow-hidden border-2 border-green-200 shadow-xl hover:shadow-2xl transition-shadow">
                    <MapContainer
                      center={[mapCenter.lat, mapCenter.lng]}
                      zoom={15}
                      style={{ width: '100%', height: '100%' }}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <MapController 
                        center={mapCenter} 
                        position={mapPosition}
                        setPosition={setMapPosition}
                        setFormData={setFormData}
                        formData={formData}
                      />
                    </MapContainer>
                  </div>
                  {mapPosition && (
                    <motion.p 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-3 text-sm text-green-700 bg-green-50 p-3 rounded-lg border border-green-200 flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="font-semibold">Location selected:</span> {mapPosition.lat.toFixed(6)}, {mapPosition.lng.toFixed(6)}
                    </motion.p>
                  )}
                </div>
              </motion.div>
            )}

            {/* Step 3: Evidence */}
            {currentStep === 3 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                        Evidence
                      </h2>
                      <p className="text-sm text-gray-500">Step 3 of 3 • Optional</p>
                    </div>
                  </div>
                  <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded-r-xl">
                    <p className="text-sm text-purple-800 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                      </svg>
                      <span className="font-medium">Upload photos, videos, or audio that support your report.</span>
                    </p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Upload photos, videos, or audio recordings
                  </label>
                  <motion.div 
                    onClick={() => fileInputRef.current?.click()}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="border-2 border-dashed border-purple-300 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-10 text-center cursor-pointer hover:border-purple-500 hover:shadow-lg transition-all group"
                  >
                    <motion.div 
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      className="text-7xl mb-4 group-hover:scale-110 transition-transform"
                    >
                      📎
                    </motion.div>
                    <p className="text-gray-800 font-bold text-lg mb-2 group-hover:text-purple-600 transition-colors">Click or drag files here</p>
                    <p className="text-sm text-gray-600 mb-3">Supported: Images, Videos, Audio</p>
                    <div className="flex items-center justify-center gap-6 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                        </svg>
                        Images
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                        </svg>
                        Videos
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                        </svg>
                        Audio
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-4">Max 5 files • 10MB each</p>
                  </motion.div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,video/*,audio/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>

                {files.length > 0 && (
                  <div className="space-y-3 mt-6">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        {files.length} File{files.length > 1 ? 's' : ''} Ready
                      </h3>
                      <span className="text-xs text-gray-500">
                        {(files.reduce((acc, f) => acc + f.size, 0) / 1024 / 1024).toFixed(2)} MB total
                      </span>
                    </div>
                    <div className="grid gap-3">
                      {files.map((file, index) => (
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          key={index}
                          className="flex items-center justify-between bg-gradient-to-r from-white to-purple-50 p-4 rounded-xl border border-purple-200 shadow-sm hover:shadow-md transition-shadow group"
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center text-2xl shadow-lg">
                              {file.type.startsWith('image') ? '🖼️' : 
                               file.type.startsWith('video') ? '🎥' : '🎵'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm text-gray-800 truncate">{file.name}</p>
                              <p className="text-xs text-gray-500">
                                {(file.size / 1024 / 1024).toFixed(2)} MB • {file.type.split('/')[0]}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => removeFile(index)}
                            className="ml-4 w-8 h-8 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 hover:text-red-700 transition-all flex items-center justify-center font-bold group-hover:scale-110"
                          >
                            ✕
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex gap-4 mt-8 pt-6 border-t-2 border-gray-200">
            {currentStep > 1 && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={prevStep}
                className="px-8 py-4 bg-white border-2 border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 hover:border-gray-400 transition-all shadow-md flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back
              </motion.button>
            )}
            
            {currentStep < 3 ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={nextStep}
                disabled={!canProceed()}
                className="flex-1 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 text-lg"
              >
                Continue to {currentStep === 1 ? 'Location' : 'Evidence'}
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                disabled={loading || !canProceed()}
                className="flex-1 px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 text-lg"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </>
                ) : (
                  <>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Submit Report
                  </>
                )}
              </motion.button>
            )}
          </div>
          </div>
        </motion.div>

        {/* Privacy Notice */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg"
        >
          <p className="text-sm text-yellow-800">
            <strong>🔒 Privacy Notice:</strong> This report is completely anonymous. 
            No personal information is collected or stored.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
