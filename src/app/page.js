"use client"
import { useState, useEffect } from 'react';
import { FaUserTie, FaUsers, FaBuilding, FaArrowRight, FaEye, FaEyeSlash, FaArrowLeft } from 'react-icons/fa';
import { FlickeringGrid } from "@/components/ui/shadcn-io/flickering-grid";
import { useUser } from '@/components/new/userContext';

// Main portal component
export default function LoginPortal() {
  const [currentView, setCurrentView] = useState('portal'); // portal, boss, staff

  const renderView = () => {
    switch(currentView) {
      case 'boss':
        return <BossLogin onBack={() => setCurrentView('portal')} />;
      case 'staff':
        return <StaffLogin onBack={() => setCurrentView('portal')} />;
      default:
        return <PortalView onBossClick={() => setCurrentView('boss')} onStaffClick={() => setCurrentView('staff')} />;
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <FlickeringGrid
        className="absolute inset-0"
        squareSize={4}
        gridGap={6}
        flickerChance={0.3}
        color="rgb(100, 100, 100)"
        maxOpacity={0.2}
      />
      
      {renderView()}
    </div>
  );
}

// Main portal view
function PortalView({ onBossClick, onStaffClick }) {
  const [isMounted, setIsMounted] = useState(false);
  const [activeCard, setActiveCard] = useState(null);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  return (
    <>
      {/* Login Portal Content Overlay */}
      <div className="absolute inset-0 flex items-center justify-center p-4 z-20">
        <div className={`w-full max-w-md transform transition-all duration-700 ${isMounted ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          
         

          {/* Login Options */}
          <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl overflow-hidden border border-white/20">
            <div className="p-1 bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-700"></div>
            
            <div className="p-8">
              <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">
                Select Login Type
              </h2>
              
              <div className="space-y-6">
                {/* BOSS Login */}
                <div 
                  className={`group flex items-center p-5 w-full rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 cursor-pointer transform transition-all duration-300 hover:scale-[1.02] hover:shadow-lg ${activeCard === 'boss' ? 'ring-2 ring-blue-500 scale-[1.02]' : ''}`}
                  onMouseEnter={() => setActiveCard('boss')}
                  onMouseLeave={() => setActiveCard(null)}
                  onClick={onBossClick}
                >
                  <div className="flex items-center justify-center h-14 w-14 rounded-full bg-white shadow-sm group-hover:shadow-md transition-all duration-300 mr-5 border border-blue-100">
                    <FaUserTie className="text-blue-600 text-xl" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800 text-lg">BOSS Login</h3>
                    <p className="text-sm text-gray-600 mt-1">Administrative access</p>
                  </div>
                  <div className="text-blue-600 transform group-hover:translate-x-2 transition-transform duration-300">
                    <FaArrowRight />
                  </div>
                </div>

                {/* Staff Login */}
                <div 
                  className={`group flex items-center p-5 w-full rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 cursor-pointer transform transition-all duration-300 hover:scale-[1.02] hover:shadow-lg ${activeCard === 'staff' ? 'ring-2 ring-indigo-500 scale-[1.02]' : ''}`}
                  onMouseEnter={() => setActiveCard('staff')}
                  onMouseLeave={() => setActiveCard(null)}
                  onClick={onStaffClick}
                >
                  <div className="flex items-center justify-center h-14 w-14 rounded-full bg-white shadow-sm group-hover:shadow-md transition-all duration-300 mr-5 border border-indigo-100">
                    <FaUsers className="text-indigo-600 text-xl" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800 text-lg">STAFF Login</h3>
                    <p className="text-sm text-gray-600 mt-1">Employee access</p>
                  </div>
                  <div className="text-indigo-600 transform group-hover:translate-x-2 transition-transform duration-300">
                    <FaArrowRight />
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                <p className="text-sm text-gray-500">
                  Need help? Contact Mahi Singh
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center text-gray-500 text-sm">
            <p>© {new Date().getFullYear()} Skillup. All rights reserved.</p>
            <p className="mt-1 text-xs">v1.1.0</p>
          </div>
        </div>
      </div>

      {/* Subtle floating elements for visual interest */}
      <div className="absolute top-1/4 left-1/4 w-20 h-20 rounded-full bg-blue-200/10 blur-xl animate-pulse-slow"></div>
      <div className="absolute bottom-1/3 right-1/4 w-16 h-16 rounded-full bg-indigo-300/10 blur-xl animate-pulse-slow delay-1000"></div>
    </>
  );
}

// BOSS Login Page with blue theme
function BossLogin({ onBack }) {
  const [showPassword, setShowPassword] = useState(false);
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useUser();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const result = await login(credentials.email, credentials.password);
      if (result.success) {
        // Redirect to boss dashboard
        window.location.href = '/boss';
      } else {
        setError(result.message || 'Login failed');
      }
    } catch (error) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="absolute inset-0 flex items-center justify-center p-4 z-20">
        <div className="w-full max-w-md">
          {/* Back button */}
          <button 
            onClick={onBack}
            className="flex items-center text-blue-700 hover:text-blue-900 mb-6 transition-colors duration-200"
          >
            <FaArrowLeft className="mr-2" />
            Back to Portal
          </button>

          {/* Login Form */}
          <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl overflow-hidden border border-white/20">
            <div className="p-1 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
            
            <div className="p-8">
              <div className="flex flex-col items-center mb-8">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg mb-4">
                  <FaUserTie className="text-white text-3xl" />
                </div>
                <h1 className="text-3xl font-bold text-gray-800">BOSS Login</h1>
                <p className="text-gray-600 mt-2">Administrative access only</p>
              </div>

              <form onSubmit={handleSubmit}>
                {error && (
                  <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                    {error}
                  </div>
                )}
                
                <div className="mb-6">
                  <label htmlFor="boss-email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    id="boss-email"
                    type="email"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    placeholder="Enter your email"
                    value={credentials.email}
                    onChange={(e) => setCredentials({...credentials, email: e.target.value})}
                    required
                  />
                </div>

                <div className="mb-6">
                  <label htmlFor="boss-password" className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="boss-password"
                      type={showPassword ? "text" : "password"}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                      placeholder="Enter your password"
                      value={credentials.password}
                      onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-3.5 text-gray-500 hover:text-blue-600"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-6">
                 
                 
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full py-3 px-4 rounded-lg font-semibold text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 ${isLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                  {isLoading ? 'Logging in...' : 'Login as BOSS'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Secure administrative access
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Subtle floating elements for visual interest */}
      <div className="absolute top-1/4 left-1/4 w-20 h-20 rounded-full bg-blue-200/10 blur-xl animate-pulse-slow"></div>
      <div className="absolute bottom-1/3 right-1/4 w-16 h-16 rounded-full bg-indigo-200/10 blur-xl animate-pulse-slow delay-1000"></div>
    </>
  );
}

// Staff Login Page with indigo theme
function StaffLogin({ onBack }) {
  const [showPassword, setShowPassword] = useState(false);
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/staff/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();
      
      if (data.success) {
        // Store staff session
        localStorage.setItem('staffSession', JSON.stringify(data.staff));
        // Redirect to staff dashboard
        window.location.href = '/staff';
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Staff login error:', error);
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="absolute inset-0 flex items-center justify-center p-4 z-20">
  <div className="w-full max-w-md">
    {/* Back button */}
    <button 
      onClick={onBack}
      className="flex items-center text-indigo-700 hover:text-indigo-900 mb-6 transition-colors duration-200"
    >
      <FaArrowLeft className="mr-2" />
      Back to Portal
    </button>

    {/* Login Form */}
    <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl overflow-hidden border border-white/20">
      <div className="p-1 bg-gradient-to-r from-indigo-500 to-purple-600"></div>
      
      <div className="p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center shadow-lg mb-4">
            <FaUsers className="text-white text-3xl" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800">STAFF Login</h1>
          <p className="text-gray-600 mt-2">Employee access portal</p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}
          
          {/* Email */}
          <div className="mb-6">
            <label htmlFor="staff-email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              id="staff-email"
              type="email"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200"
              placeholder="Enter your email"
              value={credentials.email}
              onChange={(e) => setCredentials({...credentials, email: e.target.value})}
              required
            />
          </div>

          {/* Password */}
          <div className="mb-6">
            <label htmlFor="staff-password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                id="staff-password"
                type={showPassword ? "text" : "password"}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200"
                placeholder="Enter your password"
                value={credentials.password}
                onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                required
              />
              <button
                type="button"
                className="absolute right-3 top-3.5 text-gray-500 hover:text-indigo-600"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 px-4 rounded-lg font-semibold text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200 ${isLoading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
          >
            {isLoading ? 'Logging in...' : 'Login as Staff'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Secure employee access
          </p>
        </div>
      </div>
    </div>
  </div>
</div>


      {/* Subtle floating elements for visual interest */}
      <div className="absolute top-1/4 left-1/4 w-20 h-20 rounded-full bg-indigo-200/10 blur-xl animate-pulse-slow"></div>
      <div className="absolute bottom-1/3 right-1/4 w-16 h-16 rounded-full bg-purple-200/10 blur-xl animate-pulse-slow delay-1000"></div>
    </>
  );
}