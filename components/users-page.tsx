'use client'
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import {LeftPanel, LoadingPage} from '@/components/index';
import { useRouter } from 'next/navigation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    },
    global: {
      headers: {
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`
      }
    }
  }
);

interface User {
    user_id: string,
    created_at: string,
    username: string,
    email: string,
    update_at: string,
    password_hash: string,
    role: string,
    locationid: string,
}

// Define which roles can access this page
const allowedRoles = ["admin", "owner", "kitchen", "manager", "staff"];

const UserPage = () => {
  const [userList, setUserList] = useState<User[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [pageDecimal, setPageDecimal] = useState(0);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [userData, setUserData] = useState<any>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const router = useRouter();

  // Check user authorization
  useEffect(() => {
    const checkAuth = () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
          // No user data found, redirect to login
          router.push('/');
          return;
        }

        const user = JSON.parse(storedUser);
        setUserData(user);

        // Check if user role is allowed to access this page
        if (user.role && allowedRoles.includes(user.role)) {
          setIsAuthorized(true);
        } else {
          setIsAuthorized(false);
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        router.push('/');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const handlePageDecimalIncrement = (decimal: number) => {
    setPageDecimal(decimal + 1);
    setPage((decimal + 1) * 15);
  };

  const handleUpdateCallStatus = async (user_id: string, status: boolean) => {
    try {
      
      setUserList(prevList => 
        prevList?.map(item =>
          item.user_id === user_id ? {...item, isCalled: !status} : item
        ) || null
      );

      setIsLoading(true)
      const {data, error} = await supabase
      .from("users")
      .update({isCalled: !status})
      .eq("user_id", user_id)

      if (error) throw error;

      setIsLoading(false)

    } catch (error) {
      console.error('Update error:', error);
      setIsLoading(false)

    }
  };

  const handlePageDecimalDecrement = (decimal: number) => {
    setPageDecimal(decimal - 1);
    setPage((decimal - 1) * 15);
  };

  const fetchUsers = async (page: number) => {
    if (!isAuthorized) return;
    
    try {
      const start = page;
      const end = page + 14;
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .range(start, end);

      if (error) throw error;
      setUserList(data || []);
    } catch (error) {
      console.error('Fetch error:', error);
      setUserList(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Search functionality
  const filteredUsers = userList ? userList.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  ) : null;

  useEffect(() => {
    if (isAuthorized) {
      const getCount = async () => {
        const { count } = await supabase
          .from('users')
          .select('*', { count: 'exact' });
        setTotalCount(count || 0);
      };
      getCount();
      fetchUsers(page);
    }
  }, [page, isAuthorized]);

  if (isLoading) return <LoadingPage/>;
  
  // Show access denied message if not authorized
  if (!isAuthorized) {
    return (
      <div className="flex min-h-screen bg-gray-100 text-black">
        <LeftPanel/>
        <div className="flex-1 p-4 flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-md text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="text-2xl font-bold text-red-700 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-4">
              You don't have permission to view this page. This section is restricted to admin and owner roles only.
            </p>
            <p className="text-gray-500">
              Current role: {userData?.role || 'Unknown'}
            </p>
            <button 
              onClick={() => router.push('/')}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100 text-black">
      <LeftPanel/>
      <div className="flex-1 p-4">
        <div className="bg-white p-4 rounded shadow">
          <div className="flex justify-between mb-4">
            <h1 className="text-xl font-bold">User Management</h1>
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Search by username, email or role" 
                className="border rounded px-2 py-1 w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button className="bg-orange-500 text-white px-3 py-1 rounded">
                Export
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="border p-2 text-left">ID</th>
                <th className="border p-2 text-left">Email</th>
                <th className="border p-2 text-left">Username</th>
                <th className="border p-2 text-left">Password</th>
                <th className="border p-2 text-left">Role</th>
                <th className="border p-2 text-left">Location</th>
                <th className="border p-2 text-left">Created at</th>
                <th className="border p-2 text-left">Updated at</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers && filteredUsers.length > 0 ? filteredUsers.map(user => (
                <tr key={user.user_id} className="hover:bg-gray-50">
                  <td className="border p-2">{user.user_id}</td>
                  <td className="border p-2">{user.email}</td>
                  <td className="border p-2">{user.username}</td>
                  <td className="border p-2">{user.password_hash}</td>
                  <td className="border p-2">{user.role}</td>
                  <td className="border p-2">{user.locationid}</td>
                  <td className="border p-2">{user.created_at}</td>
                  <td className="border p-2">{user.update_at}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={8} className="border p-4 text-center text-gray-500">
                    {searchTerm ? "No users found matching your search" : "No users available"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
            <div className="mt-4 flex justify-between items-center">
              <span>
                Showing {page + 1}-{Math.min(page + 15, totalCount)} of {totalCount}
              </span>
              <div className="flex gap-2">
                <button 
                  onClick={() => handlePageDecimalDecrement(pageDecimal)}
                  disabled={page === 0}
                  className="px-4 py-2 bg-gray-100 rounded disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageDecimalIncrement(pageDecimal)}
                  disabled={page + 15 >= totalCount}
                  className="px-4 py-2 bg-gray-100 rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserPage;