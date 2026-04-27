import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';

export default function HomePage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative overflow-hidden">
      {/* Topographic Background Pattern */}
      <div className="fixed inset-0 opacity-5 pointer-events-none">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="topo" width="100" height="100" patternUnits="userSpaceOnUse">
              <path d="M10 10 Q 30 20, 50 10 T 90 10" stroke="currentColor" fill="none" strokeWidth="1"/>
              <path d="M10 30 Q 30 40, 50 30 T 90 30" stroke="currentColor" fill="none" strokeWidth="1"/>
              <path d="M10 50 Q 30 60, 50 50 T 90 50" stroke="currentColor" fill="none" strokeWidth="1"/>
              <path d="M10 70 Q 30 80, 50 70 T 90 70" stroke="currentColor" fill="none" strokeWidth="1"/>
              <circle cx="50" cy="50" r="20" stroke="currentColor" fill="none" strokeWidth="0.5"/>
              <circle cx="50" cy="50" r="35" stroke="currentColor" fill="none" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#topo)" className="text-blue-600" />
        </svg>
      </div>

      {/* Floating Crime Prevention Icons */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 opacity-5 animate-float text-blue-600">
          <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="absolute top-40 right-20 opacity-5 animate-float text-indigo-600" style={{animationDelay: '1s'}}>
          <svg className="w-20 h-20" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
          </svg>
        </div>
        <div className="absolute bottom-32 left-1/4 opacity-5 animate-float text-blue-500" style={{animationDelay: '2s'}}>
          <svg className="w-28 h-28" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="absolute bottom-20 right-1/3 opacity-5 animate-float text-indigo-500" style={{animationDelay: '0.5s'}}>
          <svg className="w-22 h-22" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
          </svg>
        </div>
      </div>
      
      {/* Header */}
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-700 via-indigo-700 to-purple-800 text-white py-24 md:py-32">
        {/* Animated Mesh Gradient Background */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-gradient-to-br from-cyan-400/30 to-transparent rounded-full mix-blend-overlay filter blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-purple-400/30 to-transparent rounded-full mix-blend-overlay filter blur-3xl animate-pulse" style={{animationDelay: '1.5s'}}></div>
          <div className="absolute top-1/2 left-1/3 w-[400px] h-[400px] bg-gradient-to-br from-blue-400/20 to-transparent rounded-full mix-blend-overlay filter blur-3xl animate-pulse" style={{animationDelay: '3s'}}></div>
          <div className="absolute bottom-1/4 right-1/4 w-[450px] h-[450px] bg-gradient-to-br from-indigo-400/25 to-transparent rounded-full mix-blend-overlay filter blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
        </div>

        {/* City Skyline Silhouette */}
        <div className="absolute bottom-0 left-0 right-0 opacity-10">
          <svg className="w-full h-48" viewBox="0 0 1200 200" fill="currentColor" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            <rect x="0" y="100" width="80" height="100" />
            <rect x="90" y="80" width="60" height="120" />
            <rect x="160" y="60" width="100" height="140" />
            <rect x="270" y="90" width="70" height="110" />
            <rect x="350" y="50" width="90" height="150" />
            <rect x="450" y="70" width="80" height="130" />
            <rect x="540" y="40" width="120" height="160" />
            <rect x="670" y="85" width="75" height="115" />
            <rect x="755" y="65" width="95" height="135" />
            <rect x="860" y="95" width="70" height="105" />
            <rect x="940" y="55" width="110" height="145" />
            <rect x="1060" y="75" width="85" height="125" />
            {/* Windows pattern */}
            {Array.from({length: 40}).map((_, i) => (
              <rect key={i} x={20 + (i * 30)} y={70 + (i % 3) * 30} width="4" height="6" opacity="0.3" />
            ))}
          </svg>
        </div>

        {/* Network Connection Pattern */}
        <div className="absolute inset-0 opacity-5">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="network" width="120" height="120" patternUnits="userSpaceOnUse">
                <circle cx="20" cy="20" r="2" fill="white" />
                <circle cx="100" cy="20" r="2" fill="white" />
                <circle cx="20" cy="100" r="2" fill="white" />
                <circle cx="100" cy="100" r="2" fill="white" />
                <circle cx="60" cy="60" r="2" fill="white" />
                <line x1="20" y1="20" x2="60" y2="60" stroke="white" strokeWidth="0.5" />
                <line x1="100" y1="20" x2="60" y2="60" stroke="white" strokeWidth="0.5" />
                <line x1="20" y1="100" x2="60" y2="60" stroke="white" strokeWidth="0.5" />
                <line x1="100" y1="100" x2="60" y2="60" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#network)" />
          </svg>
        </div>

        {/* Floating Alert Icons */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 opacity-10 animate-float">
            <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="absolute top-1/3 right-20 opacity-10 animate-float" style={{animationDelay: '1s'}}>
            <svg className="w-20 h-20 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0110 1.944zM11 14a1 1 0 11-2 0 1 1 0 012 0zm0-7a1 1 0 10-2 0v3a1 1 0 102 0V7z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="absolute bottom-32 left-1/4 opacity-10 animate-float" style={{animationDelay: '2s'}}>
            <svg className="w-14 h-14 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
            </svg>
          </div>
          <div className="absolute bottom-20 right-1/3 opacity-10 animate-float" style={{animationDelay: '0.7s'}}>
            <svg className="w-18 h-18 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.div
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="inline-block mb-6"
          >
            <span className="px-6 py-2 bg-white/20 backdrop-blur-md rounded-full text-sm font-semibold border border-white/30">
              🛡️ Your Safety, Our Priority
            </span>
          </motion.div>
          
          <motion.h2 
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-6xl lg:text-7xl font-extrabold mb-6 leading-tight"
          >
            {t('appName')}
          </motion.h2>
          
          <motion.p 
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-xl md:text-2xl mb-12 max-w-3xl mx-auto text-blue-50 leading-relaxed"
          >
            {t('tagline')}
          </motion.p>
          
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex gap-4 justify-center flex-wrap"
          >
            <Link
              to="/report"
              className="group relative bg-white text-blue-700 px-10 py-4 rounded-2xl font-bold hover:bg-gray-50 transition-all shadow-2xl hover:shadow-3xl transform hover:scale-105 hover:-translate-y-1"
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {t('reportCrime')}
              </span>
            </Link>
            <Link
              to="/track"
              className="group bg-blue-500/30 backdrop-blur-md border-2 border-white/40 text-white px-10 py-4 rounded-2xl font-bold hover:bg-blue-400/40 transition-all shadow-2xl hover:shadow-3xl transform hover:scale-105 hover:-translate-y-1"
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                {t('trackReport')}
              </span>
            </Link>
            <Link
              to="/login"
              className="group bg-indigo-600/90 backdrop-blur-md border-2 border-indigo-400 text-white px-10 py-4 rounded-2xl font-bold hover:bg-indigo-500 transition-all shadow-2xl hover:shadow-3xl transform hover:scale-105 hover:-translate-y-1"
            >
              <span className="flex items-center gap-2">
                👮 Police Login
              </span>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gradient-to-br from-white to-blue-50 relative overflow-hidden">
        {/* Decorative geometric shapes */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-100 to-transparent rounded-full filter blur-3xl opacity-30"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-indigo-100 to-transparent rounded-full filter blur-3xl opacity-30"></div>
        
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-5">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="steps-grid" width="32" height="32" patternUnits="userSpaceOnUse">
                <circle cx="16" cy="16" r="1" fill="currentColor" className="text-blue-600" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#steps-grid)" />
          </svg>
        </div>
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h3 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent mb-4">
              {t('howItWorks')}
            </h3>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Report crimes in three simple steps and help make your community safer
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="relative bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all card-hover group"
            >
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
                <div className="bg-gradient-to-br from-blue-500 to-blue-700 w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </div>
              </div>
              <div className="mt-8 text-center">
                <div className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold mb-4">
                  Step 1
                </div>
                <h4 className="text-2xl font-bold mb-3 text-gray-800">Submit Report</h4>
                <p className="text-gray-600 leading-relaxed">{t('step1')}</p>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className="relative bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all card-hover group"
            >
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
                <div className="bg-gradient-to-br from-green-500 to-emerald-600 w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                </div>
              </div>
              <div className="mt-8 text-center">
                <div className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold mb-4">
                  Step 2
                </div>
                <h4 className="text-2xl font-bold mb-3 text-gray-800">Get Reference</h4>
                <p className="text-gray-600 leading-relaxed">{t('step2')}</p>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              viewport={{ once: true }}
              className="relative bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all card-hover group"
            >
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
                <div className="bg-gradient-to-br from-purple-500 to-indigo-600 w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
              </div>
              <div className="mt-8 text-center">
                <div className="inline-block px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold mb-4">
                  Step 3
                </div>
                <h4 className="text-2xl font-bold mb-3 text-gray-800">Track Status</h4>
                <p className="text-gray-600 leading-relaxed">{t('step3')}</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-700 text-white relative overflow-hidden">
        {/* Animated gradient orbs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -left-20 w-96 h-96 bg-gradient-to-br from-cyan-400/20 to-transparent rounded-full filter blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-gradient-to-br from-purple-400/20 to-transparent rounded-full filter blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        </div>
        
        {/* Hexagon pattern overlay */}
        <div className="absolute inset-0 opacity-5">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="hexagons" width="100" height="87" patternUnits="userSpaceOnUse">
                <path d="M25 0L50 14.5V43.5L25 58L0 43.5V14.5L25 0Z" stroke="white" strokeWidth="1" fill="none" />
                <path d="M75 29L100 43.5V72.5L75 87L50 72.5V43.5L75 29Z" stroke="white" strokeWidth="1" fill="none" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#hexagons)" />
          </svg>
        </div>
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h3 className="text-4xl md:text-5xl font-extrabold mb-4">
              Why Choose CrimeAlert?
            </h3>
            <p className="text-blue-100 text-lg max-w-2xl mx-auto">
              Secure, anonymous, and multilingual crime reporting platform
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {[
              { icon: "🔒", title: "100% Anonymous", desc: "Your identity is completely protected" },
              { icon: "🌍", title: "Multilingual", desc: "Report in English, Shona, or Ndebele" },
              { icon: "📱", title: "Mobile Friendly", desc: "Works on any device, anywhere" },
              { icon: "⚡", title: "Real-time Updates", desc: "Track your report status instantly" }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all card-hover"
              >
                <div className="text-5xl mb-4">{feature.icon}</div>
                <h4 className="text-xl font-bold mb-2">{feature.title}</h4>
                <p className="text-blue-100">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-gray-900 via-slate-900 to-gray-800 text-white py-12 relative overflow-hidden">
        {/* Subtle circuit board pattern */}
        <div className="absolute inset-0 opacity-5">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="circuit" width="80" height="80" patternUnits="userSpaceOnUse">
                <circle cx="20" cy="20" r="2" fill="currentColor" />
                <circle cx="60" cy="20" r="2" fill="currentColor" />
                <circle cx="20" cy="60" r="2" fill="currentColor" />
                <circle cx="60" cy="60" r="2" fill="currentColor" />
                <line x1="20" y1="20" x2="60" y2="20" stroke="currentColor" strokeWidth="0.5" />
                <line x1="20" y1="60" x2="60" y2="60" stroke="currentColor" strokeWidth="0.5" />
                <line x1="20" y1="20" x2="20" y2="60" stroke="currentColor" strokeWidth="0.5" />
                <line x1="60" y1="20" x2="60" y2="60" stroke="currentColor" strokeWidth="0.5" />
                <path d="M40 20 L40 30 L50 40 L40 50 L40 60" stroke="currentColor" strokeWidth="0.5" fill="none" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#circuit)" className="text-blue-500" />
          </svg>
        </div>
        
        {/* Gradient orbs in corners */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-blue-600/10 to-transparent rounded-full filter blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-gradient-to-tl from-indigo-600/10 to-transparent rounded-full filter blur-3xl"></div>
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-center md:text-left">
              <h3 className="text-2xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                Crime Alert System
              </h3>
              <p className="text-gray-400">Making Zimbabwe safer, one report at a time</p>
            </div>
            <div className="flex gap-6">
              <a href="#" className="text-gray-400 hover:text-white transition">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
              </a>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center">
            <p className="text-gray-400">
              &copy; {new Date().getFullYear()} Crime Alert System - Zimbabwe. All rights reserved.
            </p>
            <p className="text-sm text-gray-500 mt-2">{t('yourSafetyMatters')}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
