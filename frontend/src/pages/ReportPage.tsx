import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import { motion, AnimatePresence } from 'framer-motion';
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

export default function ReportPage() {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [mapPosition, setMapPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({ lat: -17.8252, lng: 31.0335 }); // Default: Harare
  const [gettingLocation, setGettingLocation] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
          alert('Report submitted successfully, but some files failed to upload. Your reference number: ' + response.data?.referenceNumber);
        }
      }

      setReferenceNumber(response.data?.referenceNumber || '');
      setSubmitted(true);
    } catch (error: any) {
      console.error('Error submitting report:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to submit report. Please try again.';
      alert(errorMessage);
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="bg-gradient-to-r from-green-400 to-emerald-500 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
          >
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </motion.div>
          
          <h2 className="text-3xl font-bold text-center mb-4 text-gray-800">
            Report Submitted!
          </h2>
          <p className="text-gray-600 text-center mb-6">
            Your report has been received. Save this reference number to track your report:
          </p>
          
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl mb-6 border-2 border-blue-200"
          >
            <p className="text-sm text-gray-600 text-center mb-2">Reference Number</p>
            <p className="text-3xl font-bold text-center bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {referenceNumber}
            </p>
            <button
              onClick={() => navigator.clipboard.writeText(referenceNumber)}
              className="mt-4 w-full bg-white border border-blue-200 text-blue-600 py-2 rounded-lg hover:bg-blue-50 transition text-sm font-medium"
            >
              📋 Copy Reference Number
            </button>
          </motion.div>
          
          <div className="flex gap-3">
            <Link
              to="/track"
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition shadow-lg text-center"
            >
              Track Report
            </Link>
            <Link
              to="/"
              className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-200 transition text-center"
            >
              Go Home
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            {t('appName')}
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center flex-1">
                <motion.div
                  initial={false}
                  animate={{
                    scale: currentStep === step ? 1.1 : 1,
                    backgroundColor: currentStep >= step ? '#3b82f6' : '#e5e7eb'
                  }}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-lg z-10"
                >
                  {currentStep > step ? '✓' : step}
                </motion.div>
                {step < 3 && (
                  <motion.div
                    initial={false}
                    animate={{
                      backgroundColor: currentStep > step ? '#3b82f6' : '#e5e7eb'
                    }}
                    className="flex-1 h-2 mx-2"
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between max-w-2xl mx-auto mt-2 text-sm">
            <span className={currentStep >= 1 ? 'text-blue-600 font-medium' : 'text-gray-400'}>Details</span>
            <span className={currentStep >= 2 ? 'text-blue-600 font-medium' : 'text-gray-400'}>Location</span>
            <span className={currentStep >= 3 ? 'text-blue-600 font-medium' : 'text-gray-400'}>Evidence</span>
          </div>
        </div>

        {/* Form Steps */}
        <motion.div
          key={currentStep}
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -50, opacity: 0 }}
          className="bg-white rounded-2xl shadow-xl p-8"
        >
          <AnimatePresence mode="wait">
            {/* Step 1: Report Details */}
            {currentStep === 1 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Report Details</h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  >
                    <option value="">Select a category...</option>
                    <option value="theft">{t('categories.theft')}</option>
                    <option value="assault">{t('categories.assault')}</option>
                    <option value="vandalism">{t('categories.vandalism')}</option>
                    <option value="burglary">{t('categories.burglary')}</option>
                    <option value="robbery">{t('categories.robbery')}</option>
                    <option value="fraud">{t('categories.fraud')}</option>
                    <option value="other">{t('categories.other')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title (optional)
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Brief summary..."
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    required
                    rows={6}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe what happened in detail..."
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    When did this occur?
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.occurredAt}
                    onChange={(e) => setFormData({ ...formData, occurredAt: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
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
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Location</h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address or Description *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g., Harare CBD, near Fourth Street"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nearby Landmark (optional)
                  </label>
                  <input
                    type="text"
                    value={formData.landmark}
                    onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                    placeholder="e.g., Near City Hall, Behind Central Market"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Click on map to pinpoint location (optional)
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
                      className="px-3 py-1 bg-blue-100 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-200 transition disabled:opacity-50"
                    >
                      {gettingLocation ? '📍 Getting...' : '📍 Use My Location'}
                    </button>
                  </div>
                  <div className="h-80 rounded-xl overflow-hidden border-2 border-gray-200 shadow-lg">
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
                    <p className="mt-2 text-sm text-gray-600">
                      📍 Selected: {mapPosition.lat.toFixed(6)}, {mapPosition.lng.toFixed(6)}
                    </p>
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
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Evidence (Optional)</h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload photos, videos, or audio recordings
                  </label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition"
                  >
                    <div className="text-6xl mb-4">📎</div>
                    <p className="text-gray-600 font-medium mb-2">Click to upload files</p>
                    <p className="text-sm text-gray-500">Max 5 files, 10MB each</p>
                  </div>
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
                  <div className="space-y-2">
                    <h3 className="font-medium text-gray-700">Uploaded Files:</h3>
                    {files.map((file, index) => (
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        key={index}
                        className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">
                            {file.type.startsWith('image') ? '🖼️' : 
                             file.type.startsWith('video') ? '🎥' : '🎵'}
                          </span>
                          <div>
                            <p className="font-medium text-sm">{file.name}</p>
                            <p className="text-xs text-gray-500">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => removeFile(index)}
                          className="text-red-500 hover:text-red-700 transition"
                        >
                          ✕
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex gap-4 mt-8 pt-6 border-t border-gray-200">
            {currentStep > 1 && (
              <button
                onClick={prevStep}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition"
              >
                ← Back
              </button>
            )}
            
            {currentStep < 3 ? (
              <button
                onClick={nextStep}
                disabled={!canProceed()}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg"
              >
                Continue →
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading || !canProceed()}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg"
              >
                {loading ? 'Submitting...' : '✓ Submit Report'}
              </button>
            )}
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
