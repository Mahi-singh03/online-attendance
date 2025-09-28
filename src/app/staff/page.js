'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, 
  LogIn, 
  LogOut, 
  User, 
  Calendar,
  Activity,
  AlertCircle,
  CheckCircle,
  X
} from 'lucide-react';

export default function StaffDashboard() {
  const [staff, setStaff] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: '', type: '' });

  useEffect(() => {
    // Check if staff is logged in
    const staffSession = localStorage.getItem('staffSession');
    if (!staffSession) {
      window.location.href = '/';
      return;
    }

    try {
      const staffData = JSON.parse(staffSession);
      setStaff(staffData);
      fetchAttendanceStatus(staffData.id);
    } catch (error) {
      console.error('Error parsing staff session:', error);
      localStorage.removeItem('staffSession');
      window.location.href = '/';
    }
  }, []);

  const showAlert = (message, type = 'success') => {
    setAlert({ show: true, message, type });
    setTimeout(() => setAlert({ show: false, message: '', type: '' }), 4000);
  };

  const fetchAttendanceStatus = async (staffId) => {
    try {
      const response = await fetch(`/api/staff/attendance/status?staffId=${staffId}`);
      const data = await response.json();
      
      if (data.success) {
        setAttendance(data.data);
      } else {
        showAlert(data.message || 'Error fetching attendance status', 'error');
      }
    } catch (error) {
      console.error('Error fetching attendance status:', error);
      showAlert('Error fetching attendance status', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!staff) return;
    
    setIsLoggingIn(true);
    try {
      const response = await fetch('/api/staff/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffId: staff.id }),
      });

      const data = await response.json();
      
      if (data.success) {
        showAlert('Login recorded successfully!', 'success');
        fetchAttendanceStatus(staff.id);
      } else {
        showAlert(data.message || 'Login failed', 'error');
      }
    } catch (error) {
      console.error('Login error:', error);
      showAlert('Error recording login', 'error');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    if (!staff) return;
    
    setIsLoggingOut(true);
    try {
      const response = await fetch('/api/staff/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffId: staff.id }),
      });

      const data = await response.json();
      
      if (data.success) {
        showAlert('Logout recorded successfully!', 'success');
        fetchAttendanceStatus(staff.id);
      } else {
        showAlert(data.message || 'Logout failed', 'error');
      }
    } catch (error) {
      console.error('Logout error:', error);
      showAlert('Error recording logout', 'error');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('staffSession');
    window.location.href = '/';
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!staff) {
    return <div>Redirecting...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 p-4">
      {/* Alert Notification */}
      <AnimatePresence>
        {alert.show && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
              alert.type === 'error' ? 'bg-red-500' : 'bg-green-500'
            } text-white`}
          >
            <div className="flex items-center space-x-2">
              {alert.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
              <span>{alert.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Staff Dashboard</h1>
          <p className="text-gray-600">Welcome back, {staff.name}!</p>
        </motion.div>

        {/* Staff Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-lg p-6 mb-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                <User className="text-white text-2xl" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-800">{staff.name}</h2>
                <p className="text-gray-600">{staff.email}</p>
                <p className="text-sm text-gray-500">
                  Member since {new Date(staff.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Sign Out
            </button>
          </div>
        </motion.div>

        {/* Attendance Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-lg p-6 mb-6"
        >
          <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <Activity className="mr-2 text-indigo-500" />
            Attendance Status
          </h3>

          {attendance?.isLoggedIn ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-semibold text-green-800">Currently Logged In</h4>
                  <p className="text-green-600 text-sm">
                    Login time: {new Date(attendance.activeSession.loginTime).toLocaleString()}
                  </p>
                  <p className="text-green-600 text-sm">
                    Duration: {attendance.activeSession.duration || 'Calculating...'}
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="flex items-center space-x-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  <LogOut size={20} />
                  <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
                </motion.button>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-semibold text-gray-800">Not Logged In</h4>
                  <p className="text-gray-600 text-sm">Click the button below to start your work session</p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleLogin}
                  disabled={isLoggingIn}
                  className="flex items-center space-x-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                >
                  <LogIn size={20} />
                  <span>{isLoggingIn ? 'Logging in...' : 'Login'}</span>
                </motion.button>
              </div>
            </div>
          )}

          {/* Today's Summary */}
          {attendance?.todaySummary && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h5 className="text-sm font-semibold text-gray-700 mb-2">Today's Summary</h5>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Total Sessions:</span>
                  <span className="ml-2 font-semibold">{attendance.todaySummary.totalSessions}</span>
                </div>
                <div>
                  <span className="text-gray-600">Total Duration:</span>
                  <span className="ml-2 font-semibold">{attendance.todaySummary.formattedDuration}</span>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Calendar className="mr-2 text-blue-500" />
              Attendance History
            </h3>
            <p className="text-gray-600 text-sm mb-4">View your past attendance records</p>
            <button className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors">
              View History
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Clock className="mr-2 text-purple-500" />
              Current Time
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              {new Date().toLocaleString()}
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-purple-500 text-white py-2 px-4 rounded-lg hover:bg-purple-600 transition-colors"
            >
              Refresh
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full"
    />
  </div>
);
