'use client'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation';

const Navbar = () => {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
    const [allowedPanelIds, setAllowedPanelIds] = useState<number[]>([]);
  // Check auth status on component mount
  useEffect(() => {
    // Get user data from localStorage
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        // User is logged in
        setIsLoggedIn(true);
      } else {
        // No user data found
        setIsLoggedIn(false);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      setIsLoggedIn(false);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');  // Clear only user data
    setIsLoggedIn(false);
    router.push('/');
  }
 useEffect(() => {
    // Get user role from localStorage
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        setUserRole(user.role);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  }, []);
  return (
    <div className='bg-white w-full'>
        <div>
            <div className=' flex justify-between items-center py-4 mx-auto px-3 sm:px-4 lg:px-4'>            
              <div className='flex items-start gap-4 text-5xl bg-gradient-to-r from-orange-700 to-orange-500 bg-clip-text text-transparent font-pinyon'><p>Heirloom & Vines</p> <span className='text-white bg-black px-4 font-sans font-normal text-3xl rounded-xl'>PORTAL</span></div>
              {isLoggedIn && (
                    <div className='flex gap-4 items-center'>
                      <p className='text-black  text-lg py-2 px-4 bg-orange-500 rounded-xl font-bold border-2 border-black'>User: {userRole}</p>
                      <button 
                      onClick={handleLogout} 
                      className='text-black text-lg mr-4 py-2  px-4 border-2 rounded-xl border-black hover:text-white hover:bg-black transition-colors duration-200'
                    >
                      Log out
                    </button>
                    </div>
                    
                  )}
            </div>
                
            </div>
    </div>
  )
}

export default Navbar