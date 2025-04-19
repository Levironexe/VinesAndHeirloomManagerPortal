'use client'
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { LeftPanel, LoadingPage } from '@/components/index';

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
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`
      }
    }
  }
);
interface OrderItem {
    id: number;
    order_id: number;
    menu_item_id: number;
    quantity: number;
    unit_price: number;
    special_instructions: string | null;
    status: string;
    created_at: string;
    updated_at: string;
    menu_items?: {
      name: string;
    };
  }
  
const OrderItemsPage = () => {
  const [orderItems, setOrderItems] = useState<OrderItem[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [pageDecimal, setPageDecimal] = useState(0);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const fetchOrderItems = async (startIdx: number) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
      .from('order_items')
      .select(`
        *,
        menu_items (
          name
        )
      `)
      .range(startIdx, startIdx + 14);
    
      if (error) throw error;
      setOrderItems(data || []);
    } catch (error) {
      console.error('Fetch error:', error);
      setOrderItems(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const getCount = async () => {
      const { count } = await supabase
        .from('order_items')
        .select('*', { count: 'exact', head: true });
      setTotalCount(count || 0);
    };
    getCount();
    fetchOrderItems(page);
  }, [page]);

  const handlePageDecimalIncrement = (decimal: number) => {
    setPageDecimal(decimal + 1);
    setPage((decimal + 1) * 15);
  };

  const handlePageDecimalDecrement = (decimal: number) => {
    setPageDecimal(decimal - 1);
    setPage((decimal - 1) * 15);
  };

  if (!orderItems) return <LoadingPage />;
  if (isLoading) return <LoadingPage />;

  return (
    <div className="flex min-h-screen bg-gray-100 text-black">
      <LeftPanel />
      <div className="flex-1 p-4">
        <div className="bg-white p-4 rounded shadow">
          <div className="flex justify-between mb-4">
            <h1 className="text-xl font-bold">Order Items</h1>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Search by special instructions or status"
                className="border rounded px-2 py-1 w-64"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
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
    <th className="border p-2 text-left">Order ID</th>
    <th className="border p-2 text-left">Menu Item ID</th>
    <th className="border p-2 text-left">Dish Name</th> {/* New */}
    <th className="border p-2 text-left">Quantity</th>
    <th className="border p-2 text-left">Unit Price</th>
    <th className="border p-2 text-left">Instructions</th>
    <th className="border p-2 text-left">Status</th>
    <th className="border p-2 text-left">Created At</th>
    <th className="border p-2 text-left">Updated At</th>
  </tr>
</thead>
<tbody>
  {orderItems.map(item => (
    <tr key={item.id} className="hover:bg-gray-50">
      <td className="border p-2">{item.id}</td>
      <td className="border p-2">{item.order_id}</td>
      <td className="border p-2">{item.menu_item_id}</td>
      <td className="border p-2">{item.menu_items?.name || '—'}</td> {/* New */}
      <td className="border p-2">{item.quantity}</td>
      <td className="border p-2">{item.unit_price}</td>
      <td className="border p-2">{item.special_instructions || '—'}</td>
      <td className="border p-2">{item.status}</td>
      <td className="border p-2">{item.created_at}</td>
      <td className="border p-2">{item.updated_at}</td>
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

export default OrderItemsPage;
