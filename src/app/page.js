"use client"
import { useState, useEffect } from 'react';
import { FaUserTie, FaUsers, FaBuilding, FaArrowRight } from 'react-icons/fa';
import { FlickeringGrid } from "@/components/ui/shadcn-io/flickering-grid";

export default function LoginPortal() {
  const [isMounted, setIsMounted] = useState(false);
  const [activeCard, setActiveCard] = useState(null);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

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
                  onClick={() => {/* Add navigation here */}}
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
                  onClick={() => {/* Add navigation here */}}
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
    </div>
  );
}