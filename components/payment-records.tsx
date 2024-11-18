'use client'
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import LeftPanel from './left-panel';
import LoadingPage from './loading-page';

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

interface Payment {
  id: string;
  payment_id: string;
  order_id: string;
  amount: number;
  method: string;
  status: string;
  created_at: string;
}

const PaymentDashboard = () => {
  const [payments, setPayments] = useState<Payment[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [pageDecimal, setPageDecimal] = useState(0);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const handlePageDecimalIncrement = (decimal: number) => {
    setPageDecimal(decimal + 1);
    setPage((decimal + 1) * 15);
  };

  const handlePageDecimalDecrement = (decimal: number) => {
    setPageDecimal(decimal - 1);
    setPage((decimal - 1) * 15);
  };

  const fetchPayments = async (page: number) => {
    try {
      const start = page;
      const end = page + 14;
      
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .range(start, end)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      console.error('Fetch error:', error);
      setPayments(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const getCount = async () => {
      const { count } = await supabase
        .from('payments')
        .select('*', { count: 'exact' });
      setTotalCount(count || 0);
    };
    getCount();
    fetchPayments(page);
  }, [page]);

  if (!payments) return <LoadingPage/>;
  if (isLoading) return <LoadingPage/>;

  const filteredPayments = payments.filter(payment => 
    payment.payment_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.order_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-gray-100 text-black">
      <LeftPanel/>
      <div className="flex-1 p-4">
        <div className="bg-white p-4 rounded shadow">
          <div className="flex justify-between mb-4">
            <h1 className="text-xl font-bold">Payment Records</h1>
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Search by Payment/Order ID" 
                className="border rounded px-2 py-1 w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border p-2 text-left">Payment ID</th>
                  <th className="border p-2 text-left">Order ID</th>
                  <th className="border p-2 text-left">Amount</th>
                  <th className="border p-2 text-left">Method</th>
                  <th className="border p-2 text-left">Status</th>
                  <th className="border p-2 text-left">Date</th>
                  <th className="border p-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map(payment => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="border p-2">{payment.payment_id}</td>
                    <td className="border p-2">{payment.order_id}</td>
                    <td className="border p-2">${payment.amount.toFixed(2)}</td>
                    <td className="border p-2">{payment.method}</td>
                    <td className="border p-2">
                      <span className={`px-2 py-1 rounded-full text-sm 
                        ${payment.status === 'Completed' ? 'bg-green-100 text-green-800' : 
                          payment.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-red-100 text-red-800'}`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="border p-2">
                      {new Date(payment.created_at).toLocaleDateString()}
                    </td>
                    <td className="border p-2">
                      <button className="bg-blue-500 text-white px-2 py-1 rounded mr-2">
                        Details
                      </button>
                      <button className="bg-gray-500 text-white px-2 py-1 rounded">
                        Receipt
                      </button>
                    </td>
                  </tr>
                ))}
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

export default PaymentDashboard;