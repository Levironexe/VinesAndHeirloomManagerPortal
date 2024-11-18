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

interface Vehicle {
  id: string;
  vehicle_id: string;
  type: string;
  status: string;
  current_location: string;
  capacity: number;
  current_load: number;
}

const TransportDashboard = () => {
  const [vehicles, setVehicles] = useState<Vehicle[] | null>(null);
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

  const fetchVehicles = async (page: number) => {
    try {
      const start = page;
      const end = page + 14;
      
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .range(start, end);

      if (error) throw error;
      setVehicles(data || []);
    } catch (error) {
      console.error('Fetch error:', error);
      setVehicles(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const getCount = async () => {
      const { count } = await supabase
        .from('vehicles')
        .select('*', { count: 'exact' });
      setTotalCount(count || 0);
    };
    getCount();
    fetchVehicles(page);
  }, [page]);

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchVehicles(page);
    } catch (error) {
      console.error('Error deleting vehicle:', error);
    }
  };

  if (!vehicles) return <LoadingPage/>;
  if (isLoading) return <LoadingPage/>;

  const filteredVehicles = vehicles.filter(vehicle => 
    vehicle.vehicle_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.current_location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-gray-100 text-black">
      <LeftPanel/>
      <div className="flex-1 p-4">
        <div className="bg-white p-4 rounded shadow">
          <div className="flex justify-between mb-4">
            <h1 className="text-xl font-bold">Transport Management</h1>
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Search" 
                className="border rounded px-2 py-1"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button className="bg-blue-500 text-black px-3 py-1 rounded">
                Add Vehicle
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border p-2 text-left">Vehicle ID</th>
                  <th className="border p-2 text-left">Type</th>
                  <th className="border p-2 text-left">Status</th>
                  <th className="border p-2 text-left">Location</th>
                  <th className="border p-2 text-left">Capacity</th>
                  <th className="border p-2 text-left">Current Load</th>
                  <th className="border p-2 text-left">Load %</th>
                  <th className="border p-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredVehicles.map(vehicle => (
                  <tr key={vehicle.id} className="hover:bg-gray-50">
                    <td className="border p-2">{vehicle.vehicle_id}</td>
                    <td className="border p-2">{vehicle.type}</td>
                    <td className="border p-2">
                      <span className={`px-2 py-1 rounded-full text-sm 
                        ${vehicle.status === 'Available' ? 'bg-green-100 text-green-800' : 
                          vehicle.status === 'In Transit' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-red-100 text-red-800'}`}>
                        {vehicle.status}
                      </span>
                    </td>
                    <td className="border p-2">{vehicle.current_location}</td>
                    <td className="border p-2">{vehicle.capacity}kg</td>
                    <td className="border p-2">{vehicle.current_load}kg</td>
                    <td className="border p-2">
                      {((vehicle.current_load / vehicle.capacity) * 100).toFixed(1)}%
                    </td>
                    <td className="border p-2">
                      <button className="bg-blue-500 text-white px-2 py-1 rounded mr-2">
                        Assign
                      </button>
                      <button 
                        className="bg-red-500 text-white px-2 py-1 rounded"
                        onClick={() => handleDelete(vehicle.id)}
                      >
                        Delete
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

export default TransportDashboard;