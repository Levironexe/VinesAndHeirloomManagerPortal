'use client'
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { LeftPanel, LoadingPage } from '@/components/index';
import { Users, Clock, Calendar, Coffee, Utensils, DoorOpen } from 'lucide-react';

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

interface TableStatus {
  id: number;
  table_id: number;
  status: 'available' | 'occupied' | 'reserved' | 'maintenance';
  capacity: number;
  last_updated: string;
  occupied_since: string | null;
  estimated_free_time: string | null;
}

const TableStatusPage = () => {
  const [tableList, setTableList] = useState<TableStatus[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const [viewMode, setViewMode] = useState<'layout' | 'list'>('layout');
  
  // Status update modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedTable, setSelectedTable] = useState<TableStatus | null>(null);
  const [newStatus, setNewStatus] = useState<'available' | 'occupied' | 'reserved' | 'maintenance'>('available');
  
  const fetchTables = async () => {
    try {
      setIsLoading(true);
      
      let query = supabase
        .from('table_status')
        .select('*')
        .order('table_id', { ascending: true });
      
      if (searchTerm) {
        query = query.or(`table_id.eq.${searchTerm},status.ilike.%${searchTerm}%`);
      }
      
      const { data, error, count } = await query;

      if (error) throw error;
      
      setTableList(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Fetch error:', error);
      setTableList(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
    
    // Set up a real-time subscription for table status changes
    const tableChannel = supabase
      .channel('table_status_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'table_status' 
      }, () => {
        fetchTables();
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(tableChannel);
    };
  }, [searchTerm]);

  const handleUpdateTableStatus = async () => {
    if (!selectedTable) return;
    
    try {
      setIsLoading(true);
      
      // Update the table status directly
      const { error } = await supabase
        .from('table_status')
        .update({
          status: newStatus,
          last_updated: new Date().toISOString(),
          occupied_since: newStatus === 'occupied' && selectedTable.status !== 'occupied' 
            ? new Date().toISOString() 
            : selectedTable.occupied_since,
          estimated_free_time: newStatus === 'occupied' 
            ? new Date(Date.now() + 90 * 60000).toISOString() // 90 minutes from now
            : null
        })
        .eq('table_id', selectedTable.table_id);

      if (error) throw error;

      fetchTables();
      setShowModal(false);
    } catch (error) {
      console.error('Update error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openStatusModal = (table: TableStatus) => {
    setSelectedTable(table);
    setNewStatus(table.status);
    setShowModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'border-green-500 bg-green-50';
      case 'occupied':
        return 'border-red-500 bg-red-50';
      case 'reserved':
        return 'border-blue-500 bg-blue-50';
      case 'maintenance':
        return 'border-yellow-500 bg-yellow-50';
      default:
        return 'border-gray-300 bg-gray-50';
    }
  };

  const getStatusTextColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'text-green-700';
      case 'occupied':
        return 'text-red-700';
      case 'reserved':
        return 'text-blue-700';
      case 'maintenance':
        return 'text-yellow-700';
      default:
        return 'text-gray-700';
    }
  };

  const getTableImage = (capacity: number, status: string) => {
    const baseClass = "h-16 w-16 mx-auto mb-2";
    // Different table styles based on capacity
    if (capacity <= 2) {
      return (
        <div className={`${baseClass} flex items-center justify-center`}>
          <div className="w-12 h-12 rounded-full border-4 ${getStatusColor(status)}"></div>
        </div>
      );
    } else if (capacity <= 4) {
      return (
        <div className={`${baseClass} flex items-center justify-center`}>
          <div className="w-14 h-14 rounded-md border-4 ${getStatusColor(status)}"></div>
        </div>
      );
    } else {
      return (
        <div className={`${baseClass} flex items-center justify-center`}>
          <div className="w-16 h-10 rounded-md border-4 ${getStatusColor(status)}"></div>
        </div>
      );
    }
  };

  // Format time to display
  const formatTime = (dateString: string | null) => {
    if (!dateString) return null;
    
    const date = new Date(dateString);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    return `${hours}:${minutes}`;
  };

  const getTimeRemaining = (dateString: string | null) => {
    if (!dateString) return null;
    
    const estimatedTime = new Date(dateString);
    const now = new Date();
    
    const diffMinutes = Math.floor((estimatedTime.getTime() - now.getTime()) / (1000 * 60));
    
    if (diffMinutes < 0) return 'Overtime';
    if (diffMinutes === 0) return 'Now';
    
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    
    return `${minutes}m`;
  };

  if (isLoading && !tableList) return <LoadingPage />;

  return (
    <div className="flex min-h-screen bg-gray-100 text-black">
      <LeftPanel />
      <div className="flex-1 p-4">
        <div className="bg-white p-4 rounded shadow">
          <div className="flex justify-between mb-4">
            <h1 className="text-xl font-bold">Table Status Management</h1>
            <div className="flex gap-2">
              <div className="flex border rounded overflow-hidden mr-2">
                <button 
                  className={`px-3 py-1 ${viewMode === 'layout' ? 'bg-orange-500 text-white' : 'bg-gray-100'}`}
                  onClick={() => setViewMode('layout')}
                >
                  Layout
                </button>
                <button 
                  className={`px-3 py-1 ${viewMode === 'list' ? 'bg-orange-500 text-white' : 'bg-gray-100'}`}
                  onClick={() => setViewMode('list')}
                >
                  List
                </button>
              </div>
              <input 
                type="text" 
                placeholder="Search by table number or status" 
                className="border rounded px-2 py-1 w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button 
                className="bg-orange-500 text-white px-3 py-1 rounded"
                onClick={fetchTables}
              >
                Refresh
              </button>
            </div>
          </div>

          {viewMode === 'layout' ? (
            /* Restaurant Layout View - Card Grid Style */
            <div className="p-4">
              
              {/* Status legend */}
              <div className="grid grid-cols-4 gap-4 mb-6 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center">
                  <div className="w-4 h-4 rounded border-2 border-green-500 bg-green-50 mr-2"></div>
                  <span>Available</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 rounded border-2 border-red-500 bg-red-50 mr-2"></div>
                  <span>Occupied</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 rounded border-2 border-blue-500 bg-blue-50 mr-2"></div>
                  <span>Reserved</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 rounded border-2 border-yellow-500 bg-yellow-50 mr-2"></div>
                  <span>Maintenance</span>
                </div>
              </div>
              
              {/* Tables grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {tableList && tableList.map((table) => (
                  <div 
                    key={table.id}
                    className={`border-2 ${getStatusColor(table.status)} rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer`}
                    onClick={() => openStatusModal(table)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className={`text-lg font-bold ${getStatusTextColor(table.status)}`}>
                        Table {table.table_id}
                      </h3>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusColor(table.status)} ${getStatusTextColor(table.status)}`}>
                        {table.status.charAt(0).toUpperCase() + table.status.slice(1)}
                      </span>
                    </div>
                    
                    <div className="my-3">
                      {/* Table illustration */}
                      {table.capacity <= 2 ? (
                        <div className="w-12 h-12 mx-auto rounded-full border-4 border-current"></div>
                      ) : table.capacity <= 4 ? (
                        <div className="w-14 h-14 mx-auto rounded-md border-4 border-current"></div>
                      ) : (
                        <div className="w-16 h-10 mx-auto rounded-md border-4 border-current"></div>
                      )}
                    </div>
                    
                    <div className="flex justify-between text-sm mt-3">
                      <div className="flex items-center">
                        <Users size={14} className="mr-1" />
                        <span>{table.capacity}</span>
                      </div>
                      
                      {table.status === 'occupied' && (
                        <div className="flex items-center text-red-600">
                          <Clock size={14} className="mr-1" />
                          <span>
                            {getTimeRemaining(table.estimated_free_time)}
                          </span>
                        </div>
                      )}
                      
                      {table.status === 'reserved' && (
                        <div className="flex items-center text-blue-600">
                          <Calendar size={14} className="mr-1" />
                          <span>Today</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Table List View */
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border p-2 text-left">Table #</th>
                    <th className="border p-2 text-left">Status</th>
                    <th className="border p-2 text-left">Capacity</th>
                    <th className="border p-2 text-left">Last Updated</th>
                    <th className="border p-2 text-left">Occupied Since</th>
                    <th className="border p-2 text-left">Est. Free Time</th>
                    <th className="border p-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tableList ? (
                    tableList.map(table => (
                      <tr key={table.id} className="hover:bg-gray-50">
                        <td className="border p-2">{table.table_id}</td>
                        <td className="border p-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(table.status)} ${getStatusTextColor(table.status)}`}>
                            {table.status.charAt(0).toUpperCase() + table.status.slice(1)}
                          </span>
                        </td>
                        <td className="border p-2">{table.capacity}</td>
                        <td className="border p-2">{new Date(table.last_updated).toLocaleString()}</td>
                        <td className="border p-2">
                          {table.occupied_since ? new Date(table.occupied_since).toLocaleString() : '-'}
                        </td>
                        <td className="border p-2">
                          {table.estimated_free_time ? new Date(table.estimated_free_time).toLocaleString() : '-'}
                        </td>
                        <td className="border p-2">
                          <button 
                            onClick={() => openStatusModal(table)}
                            className="bg-orange-200 hover:bg-orange-500 text-black hover:text-white transition-all duration-200 px-2 py-1 rounded text-sm"
                          >
                            Update Status
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="border p-2 text-center">
                        No tables found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              
              <div className="mt-4">
                <span>
                  Showing {tableList?.length || 0} of {totalCount} tables
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status Update Modal */}
      {showModal && selectedTable && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <div className="flex items-center gap-3 mb-4">
              <div className={`flex items-center justify-center h-16 w-16 border-4 rounded-lg ${getStatusColor(selectedTable.status)}`}>
                <span className={`font-bold text-xl ${getStatusTextColor(selectedTable.status)}`}>{selectedTable.table_id}</span>
              </div>
              <div>
                <h2 className="text-xl font-bold">Table {selectedTable.table_id}</h2>
                <p className="text-gray-600">Capacity: {selectedTable.capacity} guests</p>
              </div>
            </div>

            <div className="mb-6 p-3 bg-gray-50 rounded-lg">
              <p className="flex items-center text-sm"><Clock size={16} className="mr-2" /> 
                Last updated: {new Date(selectedTable.last_updated).toLocaleString()}
              </p>
              
              {selectedTable.occupied_since && (
                <p className="flex items-center mt-2 text-sm"><Calendar size={16} className="mr-2" /> 
                  Occupied since: {new Date(selectedTable.occupied_since).toLocaleString()}
                </p>
              )}
              
              {selectedTable.estimated_free_time && (
                <p className="flex items-center mt-2 text-sm text-red-600"><Clock size={16} className="mr-2" /> 
                  Est. available in: {getTimeRemaining(selectedTable.estimated_free_time)}
                </p>
              )}
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Update Status</label>
              <select 
                className="w-full p-2 border rounded"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as any)}
              >
                <option value="available">Available</option>
                <option value="occupied">Occupied</option>
                <option value="reserved">Reserved</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
            
            <div className="flex justify-end gap-2">
              <button 
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border rounded hover:bg-gray-100"
              >
                Cancel
              </button>
              <button 
                onClick={handleUpdateTableStatus}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TableStatusPage;