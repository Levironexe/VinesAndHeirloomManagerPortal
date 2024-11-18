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

interface Order {
  id: string;
  order_id: string;
  customer_id: string;
  date: string;
  total_items: number;
  total_amount: number;
  status: string;
  payment_status: string;
  tracking_id: string;
  delivery_address: string;
  expected_delivery: string;
}

const OrderHistory = () => {
  const [orders, setOrders] = useState<Order[] | null>(null);
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

  const fetchOrders = async (page: number) => {
    try {
      const start = page;
      const end = page + 14;
      
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .range(start, end)
        .order('date', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Fetch error:', error);
      setOrders(null);
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
    fetchOrders(page);
  }, [page]);

  if (!orders) return <LoadingPage/>;
  if (isLoading) return <LoadingPage/>;

  const filteredOrders = orders.filter(order => 
    order.order_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-gray-100 text-black">
      <LeftPanel/>
      <div className="flex-1 p-4">
        <div className="bg-white p-4 rounded shadow">
          <div className="flex justify-between mb-4">
            <h1 className="text-xl font-bold">Order History</h1>
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
                <th className="border p-2 text-left">Order ID</th>
                <th className="border p-2 text-left">Customer ID</th>
                <th className="border p-2 text-left">Date</th>
                <th className="border p-2 text-left">Items</th>
                <th className="border p-2 text-left">Amount</th>
                <th className="border p-2 text-left">Status</th>
                <th className="border p-2 text-left">Payment</th>
                <th className="border p-2 text-left">Tracking</th>
                <th className="border p-2 text-left">Expected Delivery</th>
                <th className="border p-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(order => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="border p-2">{order.order_id}</td>
                  <td className="border p-2">{order.customer_id}</td>
                  <td className="border p-2">{new Date(order.date).toLocaleDateString()}</td>
                  <td className="border p-2">{order.total_items}</td>
                  <td className="border p-2">${order.total_amount.toFixed(2)}</td>
                  <td className="border p-2">
                    <span className={`px-2 py-1 rounded-full text-sm 
                      ${order.status === 'Delivered' ? 'bg-green-100 text-green-800' : 
                        order.status === 'Processing' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-blue-100 text-blue-800'}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="border p-2">
                    <span className={`px-2 py-1 rounded-full text-sm 
                      ${order.payment_status === 'Completed' ? 'bg-green-100 text-green-800' : 
                        order.payment_status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-red-100 text-red-800'}`}>
                      {order.payment_status}
                    </span>
                  </td>
                  <td className="border p-2">{order.tracking_id || 'N/A'}</td>
                  <td className="border p-2">{order.expected_delivery ? new Date(order.expected_delivery).toLocaleDateString() : 'N/A'}</td>
                  <td className="border p-2">
                    <button className="bg-blue-500 text-white px-2 py-1 rounded mr-2">
                      Details
                    </button>
                    <button className="bg-gray-500 text-white px-2 py-1 rounded">
                      Invoice
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

export default OrderHistory;