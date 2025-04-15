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

interface reservationList {
  id: string,
  created_at: string,
  name: string,
  phoneNumber: number,
  email: number,
  startTime: string,
  guests: number,
  notes: string,
  tag: string[],
  startDate: string,
  locationAddress: string,
  locationName: string,
  isCalled: boolean,
}

const TableReservationPage = () => {
  const [reservationList, setReservationList] = useState<reservationList[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [pageDecimal, setPageDecimal] = useState(0);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const handlePageDecimalIncrement = (decimal: number) => {
    setPageDecimal(decimal + 1);
    setPage((decimal + 1) * 15);
  };

  const handleUpdateCallStatus = async (id: string, status: boolean) => {
    try {
      
      setReservationList(prevList => 
        prevList?.map(item =>
          item.id === id ? {...item, isCalled: !status} : item
        ) || null
      );

      setIsLoading(true)
      const {data, error} = await supabase
      .from("reservationlist")
      .update({isCalled: !status})
      .eq("id", id)

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

  const fetchOrders = async (page: number) => {
    try {
      const start = page;
      const end = page + 14;
      
      const { data, error } = await supabase
        .from('reservationlist')
        .select('*')
        .range(start, end)
        .order('startDate', { ascending: false });

      if (error) throw error;
      setReservationList(data || []);
    } catch (error) {
      console.error('Fetch error:', error);
      setReservationList(null);
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

  if (!reservationList) return <LoadingPage/>;
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
                <th className="border p-2 text-left">Quest name</th>
                <th className="border p-2 text-left">Phone number</th>
                <th className="border p-2 text-left">Email</th>
                <th className="border p-2 text-left">Booking time</th>
                <th className="border p-2 text-left">Booking date</th>
                <th className="border p-2 text-left">Note</th>
                <th className="border p-2 text-left">Tags</th>
                <th className="border p-2 text-left">Status</th>
                <th className="border p-2 text-left">Created at</th>
              </tr>
            </thead>
            <tbody>
              {reservationList.map(reservation => (
                <tr key={reservation.id} className="hover:bg-gray-50">
                  <td className="border p-2">{reservation.id}</td>
                  <td className="border p-2">{reservation.name}</td>
                  <td className="border p-2">{reservation.phoneNumber}</td>
                  <td className="border p-2">${reservation.email}</td>
                  <td className="border p-2">{reservation.startTime}</td>
                  <td className="border p-2">{reservation.startDate}</td>
                  <td className="border p-2">{reservation.notes}</td>
                  <td className="border p-2">{reservation.tag}</td>
                  {/* <td className="border p-2">{order.tracking_id || 'N/A'}</td>
                  <td className="border p-2">{order.expected_delivery ? new Date(order.expected_delivery).toLocaleDateString() : 'N/A'}</td> */}
                  <td className="border">
                    <button className={` text-white px-2 py-1 rounded mr-2 ${reservation.isCalled? "bg-green-500" : "bg-red-500"}`} 
                    onClick={() => handleUpdateCallStatus(reservation.id, reservation.isCalled)}>
                      {reservation.isCalled? "Called" : "Not called"}
                    </button>
                  </td>
                  <td className='border p-2'>{reservation.created_at}</td>
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

export default TableReservationPage;