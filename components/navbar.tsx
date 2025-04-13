'use client'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation';

const Navbar = () => {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
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

  return (
    <div className='bg-white w-full'>
        <div>
            <div className='flex justify-between items-center mx-auto'>
                <img src='/images/logo.png' alt='ITL logo' className='py-2 px-4'/>
                {isLoggedIn && (
                  <button 
                    onClick={handleLogout} 
                    className='text-black text-[18px] mr-4'
                  >
                    Log out
                  </button>
                )}
            </div>
        </div>
    </div>
  )
}

export default Navbar