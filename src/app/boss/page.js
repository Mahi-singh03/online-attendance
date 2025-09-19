"use client"
import { useState, useEffect } from 'react';
import { FaUserTie, FaUsers, FaBuilding, FaSignOutAlt, FaChartBar, FaClock, FaUserCheck } from 'react-icons/fa';
import { useUser } from '@/components/new/userContext';

export default function BossDashboard() {
  const [isMounted, setIsMounted] = useState(false);
  const { user, logout } = useUser();

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-red-50 to-orange-100">
      
      {/* Header */}
      <div className="bg-white/95 backdrop-blur-lg shadow-lg border-b border-red-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-600 to-orange-700 flex items-center justify-center shadow-lg mr-3">
                <FaUserTie className="text-white text-xl" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Boss Dashboard</h1>
                <p className="text-gray-600">Welcome back, {user?.name || 'Admin'}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
            >
              <FaSignOutAlt className="mr-2" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className={`transform transition-all duration-700 ${isMounted ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white/95 backdrop-blur-lg rounded-xl shadow-lg p-6 border border-red-100">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100 mr-4">
                  <FaUsers className="text-blue-600 text-xl" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Employees</p>
                  <p className="text-2xl font-bold text-gray-900">24</p>
                </div>
              </div>
            </div>

            <div className="bg-white/95 backdrop-blur-lg rounded-xl shadow-lg p-6 border border-red-100">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100 mr-4">
                  <FaUserCheck className="text-green-600 text-xl" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Present Today</p>
                  <p className="text-2xl font-bold text-gray-900">18</p>
                </div>
              </div>
            </div>

            <div className="bg-white/95 backdrop-blur-lg rounded-xl shadow-lg p-6 border border-red-100">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-yellow-100 mr-4">
                  <FaClock className="text-yellow-600 text-xl" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Late Arrivals</p>
                  <p className="text-2xl font-bold text-gray-900">3</p>
                </div>
              </div>
            </div>

            <div className="bg-white/95 backdrop-blur-lg rounded-xl shadow-lg p-6 border border-red-100">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-purple-100 mr-4">
                  <FaChartBar className="text-purple-600 text-xl" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Attendance Rate</p>
                  <p className="text-2xl font-bold text-gray-900">75%</p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Dashboard Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Activity */}
            <div className="bg-white/95 backdrop-blur-lg rounded-xl shadow-lg p-6 border border-red-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h3>
              <div className="space-y-4">
                <div className="flex items-center p-3 bg-green-50 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">John Doe checked in</p>
                    <p className="text-xs text-gray-600">9:15 AM</p>
                  </div>
                </div>
                <div className="flex items-center p-3 bg-yellow-50 rounded-lg">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">Jane Smith checked in (Late)</p>
                    <p className="text-xs text-gray-600">9:45 AM</p>
                  </div>
                </div>
                <div className="flex items-center p-3 bg-blue-50 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">Mike Johnson checked out</p>
                    <p className="text-xs text-gray-600">5:30 PM</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white/95 backdrop-blur-lg rounded-xl shadow-lg p-6 border border-red-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <a 
                  href="/boss/staff"
                  className="w-full text-left p-4 bg-red-50 hover:bg-red-100 rounded-lg transition-colors duration-200 block"
                >
                  <div className="flex items-center">
                    <FaUsers className="text-red-600 mr-3" />
                    <div>
                      <p className="font-medium text-gray-800">Manage Staff</p>
                      <p className="text-sm text-gray-600">Add, edit, or remove staff members</p>
                    </div>
                  </div>
                </a>
                <button className="w-full text-left p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors duration-200">
                  <div className="flex items-center">
                    <FaChartBar className="text-blue-600 mr-3" />
                    <div>
                      <p className="font-medium text-gray-800">View Reports</p>
                      <p className="text-sm text-gray-600">Generate attendance reports</p>
                    </div>
                  </div>
                </button>
                <button className="w-full text-left p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors duration-200">
                  <div className="flex items-center">
                    <FaClock className="text-green-600 mr-3" />
                    <div>
                      <p className="font-medium text-gray-800">Attendance Settings</p>
                      <p className="text-sm text-gray-600">Configure work hours and policies</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Subtle floating elements for visual interest */}
      <div className="absolute top-1/4 left-1/4 w-20 h-20 rounded-full bg-red-200/10 blur-xl animate-pulse-slow"></div>
      <div className="absolute bottom-1/3 right-1/4 w-16 h-16 rounded-full bg-orange-200/10 blur-xl animate-pulse-slow delay-1000"></div>
    </div>
  );
}