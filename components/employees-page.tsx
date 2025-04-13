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

interface Employee {
  id: string,
  created_at: string,
  firstName: string,
  lastName: string,
  email: string,
  phoneNumber: string,
  emergencyContact: string,
  position: string,
  department: string,
  employeeId: string,
  startDate: string,
  employmentStatus: string,
  vacationDaysTotal: number,
  vacationDaysUsed: number,
  sickDaysTotal: number,
  sickDaysUsed: number,
  salary: number,
  skills: string[],
  lastReviewDate: string,
  performanceRating: number,
  isActive: boolean,
  locationId: number
}

const EmployeesPage = () => {
  const [employees, setEmployees] = useState<Employee[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [pageDecimal, setPageDecimal] = useState(0);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const handlePageDecimalIncrement = (decimal: number) => {
    setPageDecimal(decimal + 1);
    setPage((decimal + 1) * 15);
  };

  const handleUpdateActiveStatus = async (id: string, status: boolean) => {
    try {
      setEmployees(prevList => 
        prevList?.map(item =>
          item.id === id ? {...item, isActive: !status} : item
        ) || null
      );

      setIsLoading(true)
      const {data, error} = await supabase
      .from("employees")
      .update({isActive: !status})
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

  const fetchEmployees = async (page: number) => {
    try {
      const start = page;
      const end = page + 14;
      
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .range(start, end)
        .order('startDate', { ascending: false });

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Fetch error:', error);
      setEmployees(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const getCount = async () => {
      const { count } = await supabase
        .from('employees')
        .select('*', { count: 'exact' });
      setTotalCount(count || 0);
    };
    getCount();
    fetchEmployees(page);
  }, [page]);

  if (!employees) return <LoadingPage/>;
  if (isLoading) return <LoadingPage/>;

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  return (
    <div className="flex min-h-screen bg-gray-100 text-black">
      <LeftPanel/>
      <div className="flex-1 p-4">
        <div className="bg-white p-4 rounded shadow">
          <div className="flex justify-between mb-4">
            <h1 className="text-xl font-bold">Employee Management</h1>
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Search by name or position" 
                className="border rounded px-2 py-1 w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button className="bg-blue-500 text-white px-3 py-1 rounded">
                Export
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="border p-2 text-left">ID</th>
                <th className="border p-2 text-left">Name</th>
                <th className="border p-2 text-left">Position</th>
                <th className="border p-2 text-left">Department</th>
                <th className="border p-2 text-left">Phone</th>
                <th className="border p-2 text-left">Email</th>
                <th className="border p-2 text-left">Start Date</th>
                <th className="border p-2 text-left">Status</th>
                <th className="border p-2 text-left">Salary</th>
                <th className="border p-2 text-left">Skills</th>
                <th className="border p-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map(employee => (
                <tr key={employee.id} className="hover:bg-gray-50">
                  <td className="border p-2">{employee.employeeId}</td>
                  <td className="border p-2">{employee.firstName} {employee.lastName}</td>
                  <td className="border p-2">{employee.position}</td>
                  <td className="border p-2">{employee.department}</td>
                  <td className="border p-2">{employee.phoneNumber}</td>
                  <td className="border p-2">{employee.email}</td>
                  <td className="border p-2">{new Date(employee.startDate).toLocaleDateString()}</td>
                  <td className="border p-2">
                    <span className={`px-2 py-1 rounded-full text-xs text-white ${employee.employmentStatus === 'full-time' ? 'bg-green-500' : employee.employmentStatus === 'part-time' ? 'bg-blue-500' : 'bg-orange-500'}`}>
                      {employee.employmentStatus}
                    </span>
                  </td>
                  <td className="border p-2">{formatCurrency(employee.salary)}</td>
                  <td className="border p-2">
                    <div className="flex flex-wrap gap-1">
                      {employee.skills.slice(0, 2).map((skill, index) => (
                        <span key={index} className="bg-gray-200 px-1 rounded text-xs">
                          {skill}
                        </span>
                      ))}
                      {employee.skills.length > 2 && (
                        <span className="bg-gray-200 px-1 rounded text-xs">+{employee.skills.length - 2}</span>
                      )}
                    </div>
                  </td>
                  <td className="border p-2">
                    <button 
                      className={`text-white px-2 py-1 rounded mr-2 ${employee.isActive ? "bg-green-500" : "bg-red-500"}`} 
                      onClick={() => handleUpdateActiveStatus(employee.id, employee.isActive)}
                    >
                      {employee.isActive ? "Active" : "Inactive"}
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

export default EmployeesPage;