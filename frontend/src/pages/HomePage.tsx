import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

export default function HomePage() {
  const { t, i18n } = useTranslation();

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-blue-700 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">{t('appName')}</h1>
            <div className="flex gap-2">
              <button
                onClick={() => changeLanguage('en')}
                className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-500"
              >
                English
              </button>
              <button
                onClick={() => changeLanguage('sn')}
                className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-500"
              >
                Shona
              </button>
              <button
                onClick={() => changeLanguage('nd')}
                className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-500"
              >
                Ndebele
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <motion.h2 
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="text-5xl font-bold mb-4"
          >
            {t('appName')}
          </motion.h2>
          <motion.p 
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl mb-8"
          >
            {t('tagline')}
          </motion.p>
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex gap-4 justify-center flex-wrap"
          >
            <Link
              to="/report"
              className="bg-white text-blue-700 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              {t('reportCrime')}
            </Link>
            <Link
              to="/track"
              className="bg-blue-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-400 transition shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              {t('trackReport')}
            </Link>
            <Link
              to="/login"
              className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-500 transition shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              👮 Police Login
            </Link>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold text-center mb-12">{t('howItWorks')}</h3>
          <div className="grid md:grid-cols-3 gap-8">
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="text-center p-6"
            >
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <span className="text-2xl font-bold text-blue-700">1</span>
              </div>
              <h4 className="text-xl font-semibold mb-2">Submit Report</h4>
              <p className="text-gray-600">{t('step1')}</p>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className="text-center p-6"
            >
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <span className="text-2xl font-bold text-green-700">2</span>
              </div>
              <h4 className="text-xl font-semibold mb-2">Get Reference</h4>
              <p className="text-gray-600">{t('step2')}</p>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              viewport={{ once: true }}
              className="text-center p-6"
            >
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <span className="text-2xl font-bold text-purple-700">3</span>
              </div>
              <h4 className="text-xl font-semibold mb-2">Track Status</h4>
              <p className="text-gray-600">{t('step3')}</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="container mx-auto px-4 text-center">
            <p>&copy; {new Date().getFullYear()} Crime Alert System - Zimbabwe</p>
          <p className="text-sm text-gray-400 mt-2">{t('yourSafetyMatters')}</p>
        </div>
      </footer>
    </div>
  );
}
