"use client"
import { useState, useEffect } from 'react';
import { FaUser, FaClock, FaSignOutAlt, FaCheckCircle, FaTimesCircle, FaWifi, FaEthernet } from 'react-icons/fa';

export default function StaffDashboard() {
  const [staff, setStaff] = useState(null);
  const [networkInfo, setNetworkInfo] = useState(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    
    // Get staff info from localStorage
    const staffToken = localStorage.getItem('staffToken');
    const staffNetworkInfo = localStorage.getItem('staffNetworkInfo');
    
    if (staffToken) {
      setStaff(JSON.parse(staffToken));
    }
    if (staffNetworkInfo) {
      setNetworkInfo(JSON.parse(staffNetworkInfo));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('staffToken');
    localStorage.removeItem('staffNetworkInfo');
    window.location.href = '/';
  };

  const handleCheckIn = () => {
    // TODO: Implement check-in functionality
    alert('Check-in functionality will be implemented here');
  };

  const handleCheckOut = () => {
    // TODO: Implement check-out functionality
    alert('Check-out functionality will be implemented here');
  };

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!staff) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">Please login to access your dashboard</p>
          <button
            onClick={() => window.location.href = '/'}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-indigo-50 to-purple-100">
      
      {/* Header */}
      <div className="bg-white/95 backdrop-blur-lg shadow-lg border-b border-indigo-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center shadow-lg mr-3">
                <FaUser className="text-white text-xl" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Staff Dashboard</h1>
                <p className="text-gray-600">Welcome back, {staff.name}</p>
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
          
          {/* Network Status Card */}
          {networkInfo && (
            <div className="bg-white/95 backdrop-blur-lg rounded-xl shadow-lg p-6 border border-indigo-100 mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <FaWifi className="mr-2 text-indigo-600" />
                Network Status
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center p-3 bg-green-50 rounded-lg">
                  <FaCheckCircle className="text-green-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-800">Connection Status</p>
                    <p className="text-xs text-gray-600">Connected from office network</p>
                  </div>
                </div>
                <div className="flex items-center p-3 bg-blue-50 rounded-lg">
                  <FaEthernet className="text-blue-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-800">Your IP Address</p>
                    <p className="text-xs text-gray-600 font-mono">{networkInfo.clientIP}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Attendance Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Check In */}
            <div className="bg-white/95 backdrop-blur-lg rounded-xl shadow-lg p-6 border border-indigo-100">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mr-4">
                  <FaCheckCircle className="text-green-600 text-xl" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Check In</h3>
                  <p className="text-sm text-gray-600">Record your arrival time</p>
                </div>
              </div>
              <button
                onClick={handleCheckIn}
                className="w-full py-3 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 font-semibold"
              >
                Check In Now
              </button>
            </div>

            {/* Check Out */}
            <div className="bg-white/95 backdrop-blur-lg rounded-xl shadow-lg p-6 border border-indigo-100">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mr-4">
                  <FaTimesCircle className="text-red-600 text-xl" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Check Out</h3>
                  <p className="text-sm text-gray-600">Record your departure time</p>
                </div>
              </div>
              <button
                onClick={handleCheckOut}
                className="w-full py-3 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 font-semibold"
              >
                Check Out Now
              </button>
            </div>
          </div>

          {/* Staff Info */}
          <div className="bg-white/95 backdrop-blur-lg rounded-xl shadow-lg p-6 border border-indigo-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Name</p>
                <p className="text-lg text-gray-800">{staff.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Email</p>
                <p className="text-lg text-gray-800">{staff.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Role</p>
                <p className="text-lg text-gray-800 capitalize">{staff.role}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Login Time</p>
                <p className="text-lg text-gray-800">
                  {networkInfo ? new Date(networkInfo.loginTime).toLocaleString() : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Subtle floating elements for visual interest */}
      <div className="absolute top-1/4 left-1/4 w-20 h-20 rounded-full bg-indigo-200/10 blur-xl animate-pulse-slow"></div>
      <div className="absolute bottom-1/3 right-1/4 w-16 h-16 rounded-full bg-purple-200/10 blur-xl animate-pulse-slow delay-1000"></div>
    </div>
  );
}
