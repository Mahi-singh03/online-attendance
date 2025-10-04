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

import GroupChat from '@/components/ui/chat';

export default function StaffDashboard() {
  const [staff, setStaff] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: '', type: '' });
  const [activeTab, setActiveTab] = useState('attendance');

  useEffect(() => {
    // Check if staff is logged in
    const staffSession = localStorage.getItem('staffSession');
    const tokenFallback = localStorage.getItem('staffToken');
    if (!staffSession) {
      window.location.href = '/';
      return;
    }

    try {
      const staffData = JSON.parse(staffSession);
      // ensure token present by fallback if necessary
      const token = staffData.token || tokenFallback;
      const normalized = token ? { ...staffData, token } : staffData;
      setStaff(normalized);
      if (!token) {
        // force re-login to obtain token for protected routes
        localStorage.removeItem('staffSession');
        window.location.href = '/';
        return;
      }
      fetchAttendanceStatus(normalized.id);
      fetchTasks(normalized.id);
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

  const fetchTasks = async (staffId) => {
    try {
      const currentToken = staff?.token || localStorage.getItem('staffToken') || JSON.parse(localStorage.getItem('staffSession') || '{}').token;
      if (!currentToken) {
        showAlert('Session expired. Please log in again.', 'error');
        localStorage.removeItem('staffSession');
        window.location.href = '/';
        return;
      }
      const response = await fetch(`/api/staff/tasks/staff?staffId=${staffId}`, {
        headers: { Authorization: `Bearer ${currentToken}` }
      });
      const data = await response.json();
      
      if (data.tasks) {
        setTasks(data.tasks);
      } else {
        showAlert('Error fetching tasks', 'error');
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      showAlert('Error fetching tasks', 'error');
    }
  };

  const updateTaskProgress = async (taskId, progress) => {
    try {
      const token = staff?.token;
      const response = await fetch(`/api/staff/tasks/staff/${taskId}/progress`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ progress })
      });
      
      const data = await response.json();
      
      if (data.task) {
        setTasks(prev => prev.map(task => 
          task._id === taskId ? data.task : task
        ));
        showAlert('Progress updated successfully!', 'success');
      } else {
        showAlert('Error updating progress', 'error');
      }
    } catch (error) {
      console.error('Error updating progress:', error);
      showAlert('Error updating progress', 'error');
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
          
          {/* Tab Navigation */}
          <div className="flex justify-center mt-6">
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('attendance')}
                className={`px-4 py-2 rounded-md font-medium transition-all duration-200 ${
                  activeTab === 'attendance' 
                    ? 'bg-white text-indigo-700 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Attendance
              </button>
              <button
                onClick={() => setActiveTab('tasks')}
                className={`px-4 py-2 rounded-md font-medium transition-all duration-200 ${
                  activeTab === 'tasks' 
                    ? 'bg-white text-indigo-700 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                My Tasks
              </button>
              <button
                onClick={() => setActiveTab('chat')}
                className={`px-4 py-2 rounded-md font-medium transition-all duration-200 ${
                  activeTab === 'chat' 
                    ? 'bg-white text-indigo-700 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Chat
              </button>
            </div>
          </div>
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


        {/* Tab Content */}
        {activeTab === 'attendance' && (
          <>
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
          </>
        )}

        {/* Task Management Tab */}
        {activeTab === 'tasks' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <CheckCircle className="mr-2 text-indigo-500" />
                My Tasks
              </h3>
              
              {tasks.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">🎯</div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">No tasks assigned</h4>
                  <p className="text-gray-600">You're all caught up! New tasks will appear here when assigned.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {tasks.map((task) => (
                    <div key={task._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-semibold text-lg text-gray-900">{task.title}</h4>
                        <div className="flex gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            task.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            task.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                            task.status === 'completed' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {task.status}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            task.priority === 'low' ? 'bg-gray-100 text-gray-800' :
                            task.priority === 'medium' ? 'bg-blue-100 text-blue-800' :
                            task.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {task.priority}
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-3">{task.description}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-sm">
                        <div>
                          <span className="text-gray-500">Due Date: </span>
                          <span className="font-medium text-gray-900">
                            {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Assigned by: </span>
                          <span className="font-medium text-gray-900">{task.assignedBy?.name || 'Admin'}</span>
                        </div>
                      </div>

                      {/* Progress Section */}
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-600">Progress</span>
                            <span className="font-medium text-gray-900">{task.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div 
                              className="bg-gradient-to-r from-indigo-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                              style={{ width: `${task.progress}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* Quick Progress Controls */}
                        <div className="flex flex-wrap gap-2">
                          {[0, 25, 50, 75, 100].map((value) => (
                            <button
                              key={value}
                              onClick={() => updateTaskProgress(task._id, value)}
                              className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 flex-1 min-w-[50px] ${
                                task.progress === value
                                  ? 'bg-indigo-600 text-white shadow-sm'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              {value}%
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}



{activeTab === 'chat' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
          <GroupChat />
          </motion.div>
)}
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
