'use client'
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import {LeftPanel, LoadingPage} from '@/components/index';

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

interface user {
    user_id: string,
    created_at: string,
    username: string,
    email: string,
    update_at: string,
    password_hash: string,
    role: string,
    locationid: string,
}

const UserPage = () => {
  const [userList, setUserList] = useState<user[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [pageDecimal, setPageDecimal] = useState(0);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

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
  }

  const handlePageDecimalDecrement = (decimal: number) => {
    setPageDecimal(decimal - 1);
    setPage((decimal - 1) * 15);
  };

  const fetchUsers = async (page: number) => {
    try {
      const start = page;
      const end = page + 14;
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .range(start, end)

      if (error) throw error;
      setUserList(data || []);
    } catch (error) {
      console.error('Fetch error:', error);
      setUserList(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const getCount = async () => {
      const { count } = await supabase
        .from('orders')
        .select('*', { count: 'exact' });
      setTotalCount(count || 0);
    };
    getCount();
    fetchUsers(page);
  }, [page]);

  if (!setUserList) return <LoadingPage/>;
  if (isLoading) return <LoadingPage/>;



  return (
    <div className="flex min-h-screen bg-gray-100 text-black">
      <LeftPanel/>
      <div className="flex-1 p-4">
        <div className="bg-white p-4 rounded shadow">
          <div className="flex justify-between mb-4">
            <h1 className="text-xl font-bold">Table Reservation</h1>
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Search by order ID or status" 
                className="border rounded px-2 py-1 w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button className="bg-blue-500 text-black px-3 py-1 rounded">
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
              { userList != null ? userList.map(users => (
                <tr key={users.user_id} className="hover:bg-gray-50">
                  <td className="border p-2">{users.user_id}</td>
                  <td className="border p-2">{users.email}</td>
                  <td className="border p-2">{users.username}</td>
                  <td className="border p-2">{users.password_hash}</td>
                  <td className="border p-2">{users.role}</td>
                  <td className="border p-2">{users.locationid}</td>
                  <td className="border p-2">{users.created_at}</td>
                  <td className="border p-2">{users.update_at}</td>
                </tr>
              )): <p>user list is empty</p>}
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