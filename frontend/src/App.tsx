import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import ReportPage from './pages/ReportPage';
import TrackPage from './pages/TrackPage';
import DashboardPage from './pages/DashboardPage';
import SmsInboxPage from './pages/SmsInboxPage';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/report" element={<ReportPage />} />
          <Route path="/track" element={<TrackPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute requiredRoles={['admin', 'supervisor', 'officer']}>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sms-inbox"
            element={
              <ProtectedRoute requiredRoles={['admin', 'supervisor', 'officer']}>
                <SmsInboxPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
