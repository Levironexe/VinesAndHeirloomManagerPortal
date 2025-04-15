'use client'
import React, { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { LeftPanel, LoadingPage } from '@/components/index'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Calendar, DollarSign, Users, TrendingUp, Filter } from 'lucide-react'

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
)

interface Location {
  id: number
  name: string
  city: string
  address: string
  isactive: boolean
}

interface RevenueData {
  id: number
  location_id: number
  location_name: string
  date: string
  daily_revenue: number
  target_revenue: number
  customer_count: number
  average_bill: number
  created_at: string
}

interface RevenueSummary {
  locationId: number
  locationName: string
  totalRevenue: number
  averageRevenue: number
  totalCustomers: number
  daysAboveTarget: number
  totalDays: number
}

const RevenueDashboardPage = () => {
  const [locations, setLocations] = useState<Location[]>([])
  const [revenueData, setRevenueData] = useState<RevenueData[]>([])
  const [summaryData, setSummaryData] = useState<RevenueSummary[]>([])
  const [chartData, setChartData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filter states
  const [selectedLocation, setSelectedLocation] = useState<number | null>(null)
  const [dateRange, setDateRange] = useState<'7d' | '14d' | '30d'>('14d')
  const [chartView, setChartView] = useState<'daily' | 'location'>('daily')

  // Fetch locations and revenue data
  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true)
        setError(null)
        
        // Fetch locations
        const { data: locationsData, error: locationsError } = await supabase
          .from('locations')
          .select('*')
          .eq('isactive', true)
          .order('name')
        
        if (locationsError) throw locationsError
        setLocations(locationsData || [])
        
        // Set default selected location if none is selected
        if (!selectedLocation && locationsData && locationsData.length > 0) {
          setSelectedLocation(locationsData[0].id)
        }
        
        // Fetch revenue data with date filter
        let daysToFetch = 14 // default
        if (dateRange === '7d') daysToFetch = 7
        if (dateRange === '30d') daysToFetch = 30
        
        const fromDate = new Date()
        fromDate.setDate(fromDate.getDate() - daysToFetch)
        const fromDateStr = fromDate.toISOString().split('T')[0]
        
        let query = supabase
          .from('revenue_data')
          .select(`
            id,
            location_id,
            date,
            daily_revenue,
            target_revenue,
            customer_count,
            average_bill,
            created_at
          `)
          .gte('date', fromDateStr)
          .order('date', { ascending: true })
        
        // Add location filter if selected
        if (selectedLocation) {
          query = query.eq('location_id', selectedLocation)
        }
        
        const { data: revenueResult, error: revenueError } = await query
        
        if (revenueError) throw revenueError
        
        // Join location names to revenue data
        const enhancedRevenueData = revenueResult?.map(rev => {
          const location = locationsData?.find(loc => loc.id === rev.location_id)
          return {
            ...rev,
            location_name: location?.name || `Location ${rev.location_id}`
          }
        }) || []
        
        setRevenueData(enhancedRevenueData)
        
        // Prepare data for charts
        prepareChartData(enhancedRevenueData, locationsData || [])
        
        // Calculate summary statistics
        calculateSummary(enhancedRevenueData, locationsData || [])
        
      } catch (err: any) {
        console.error('Error fetching data:', err)
        setError(err.message || 'An error occurred while fetching data')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchData()
  }, [selectedLocation, dateRange])
  
  // Prepare data for charts
  const prepareChartData = (revenueData: RevenueData[], locations: Location[]) => {
    if (chartView === 'daily') {
      // Group by date for timeline view
      const dailyData = revenueData.reduce((acc, item) => {
        const existingDay = acc.find(d => d.date === item.date)
        
        if (existingDay) {
          existingDay.revenue += Number(item.daily_revenue)
          existingDay.target += Number(item.target_revenue)
          existingDay.customers += item.customer_count
          existingDay[`revenue_${item.location_id}`] = Number(item.daily_revenue)
        } else {
          const newDay: any = {
            date: item.date,
            displayDate: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            revenue: Number(item.daily_revenue),
            target: Number(item.target_revenue),
            customers: item.customer_count
          }
          
          // Add revenue per location for stacked charts
          locations.forEach(loc => {
            newDay[`revenue_${loc.id}`] = loc.id === item.location_id ? Number(item.daily_revenue) : 0
          })
          
          acc.push(newDay)
        }
        
        return acc
      }, [] as any[])
      
      setChartData(dailyData)
    } else {
      // Group by location for comparison view
      const locationData = locations.map(location => {
        const locationRevenue = revenueData.filter(r => r.location_id === location.id)
        
        const totalRevenue = locationRevenue.reduce((sum, item) => sum + Number(item.daily_revenue), 0)
        const totalTarget = locationRevenue.reduce((sum, item) => sum + Number(item.target_revenue), 0)
        const totalCustomers = locationRevenue.reduce((sum, item) => sum + item.customer_count, 0)
        const averageBill = totalRevenue / totalCustomers || 0
        
        return {
          locationId: location.id,
          name: location.name,
          revenue: totalRevenue,
          target: totalTarget,
          customers: totalCustomers,
          averageBill: averageBill,
          daysCount: locationRevenue.length
        }
      })
      
      setChartData(locationData)
    }
  }
  
  // Calculate summary statistics
  const calculateSummary = (revenueData: RevenueData[], locations: Location[]) => {
    const summary = locations.map(location => {
      const locationRevenue = revenueData.filter(r => r.location_id === location.id)
      
      const totalRevenue = locationRevenue.reduce((sum, item) => sum + Number(item.daily_revenue), 0)
      const totalDays = locationRevenue.length
      const averageRevenue = totalDays ? totalRevenue / totalDays : 0
      const totalCustomers = locationRevenue.reduce((sum, item) => sum + item.customer_count, 0)
      const daysAboveTarget = locationRevenue.filter(r => Number(r.daily_revenue) >= Number(r.target_revenue)).length
      
      return {
        locationId: location.id,
        locationName: location.name,
        totalRevenue,
        averageRevenue,
        totalCustomers,
        daysAboveTarget,
        totalDays
      }
    })
    
    setSummaryData(summary)
  }
  
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }
  
  if (isLoading) return <LoadingPage />

  return (
    <div className="flex min-h-screen bg-gray-100 text-black">
      <LeftPanel />
      <div className="flex-1 p-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Revenue Dashboard</h1>
          <p className="text-gray-600">View and analyze revenue data across locations</p>
        </div>
        
        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Location</label>
              <select 
                className="border border-gray-300 rounded-md p-2 min-w-[200px]"
                value={selectedLocation || ''}
                onChange={(e) => setSelectedLocation(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">All Locations</option>
                {locations.map(location => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Time Period</label>
              <div className="flex border border-gray-300 rounded-md overflow-hidden">
                <button 
                  className={`px-3 py-2 ${dateRange === '7d' ? 'bg-orange-500 text-white' : 'bg-white'}`}
                  onClick={() => setDateRange('7d')}
                >
                  7 Days
                </button>
                <button 
                  className={`px-3 py-2 ${dateRange === '14d' ? 'bg-orange-500 text-white' : 'bg-white'}`}
                  onClick={() => setDateRange('14d')}
                >
                  14 Days
                </button>
                <button 
                  className={`px-3 py-2 ${dateRange === '30d' ? 'bg-orange-500 text-white' : 'bg-white'}`}
                  onClick={() => setDateRange('30d')}
                >
                  30 Days
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Chart View</label>
              <div className="flex border border-gray-300 rounded-md overflow-hidden">
                <button 
                  className={`px-3 py-2 ${chartView === 'daily' ? 'bg-orange-500 text-white' : 'bg-white'}`}
                  onClick={() => setChartView('daily')}
                >
                  Daily Trend
                </button>
                <button 
                  className={`px-3 py-2 ${chartView === 'location' ? 'bg-orange-500 text-white' : 'bg-white'}`}
                  onClick={() => setChartView('location')}
                >
                  Location Comparison
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Error message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            <h3 className="font-bold">Error</h3>
            <p>{error}</p>
          </div>
        )}
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Total Revenue Card */}
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500">Total Revenue</p>
                <h3 className="text-2xl font-bold mt-1">
                  {formatCurrency(summaryData.reduce((sum, loc) => sum + loc.totalRevenue, 0))}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  {dateRange === '7d' ? 'Past 7 days' : dateRange === '14d' ? 'Past 14 days' : 'Past 30 days'}
                </p>
              </div>
              <div className="bg-orange-100 p-2 rounded-lg">
                <DollarSign size={24} className="text-orange-500" />
              </div>
            </div>
          </div>
          
          {/* Average Daily Revenue Card */}
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500">Avg. Daily Revenue</p>
                <h3 className="text-2xl font-bold mt-1">
                  {formatCurrency(
                    summaryData.reduce((sum, loc) => sum + loc.totalRevenue, 0) / 
                    Math.max(1, summaryData.reduce((days, loc) => days + loc.totalDays, 0) / Math.max(1, summaryData.length))
                  )}
                </h3>
                <p className="text-xs text-gray-500 mt-1">Per location average</p>
              </div>
              <div className="bg-green-100 p-2 rounded-lg">
                <TrendingUp size={24} className="text-green-500" />
              </div>
            </div>
          </div>
          
          {/* Total Customers Card */}
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500">Total Customers</p>
                <h3 className="text-2xl font-bold mt-1">
                  {summaryData.reduce((sum, loc) => sum + loc.totalCustomers, 0).toLocaleString()}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  {dateRange === '7d' ? 'Past 7 days' : dateRange === '14d' ? 'Past 14 days' : 'Past 30 days'}
                </p>
              </div>
              <div className="bg-purple-100 p-2 rounded-lg">
                <Users size={24} className="text-purple-500" />
              </div>
            </div>
          </div>
          
          {/* Target Performance Card */}
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500">Target Performance</p>
                <h3 className="text-2xl font-bold mt-1">
                  {summaryData.reduce((sum, loc) => sum + loc.daysAboveTarget, 0)} / {summaryData.reduce((sum, loc) => sum + loc.totalDays, 0)}
                </h3>
                <p className="text-xs text-gray-500 mt-1">Days above target</p>
              </div>
              <div className="bg-orange-100 p-2 rounded-lg">
                <Calendar size={24} className="text-orange-500" />
              </div>
            </div>
          </div>
        </div>
        
        {/* Main Charts */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <h2 className="text-xl font-bold mb-4">
            {chartView === 'daily' 
              ? 'Daily Revenue Trend' 
              : 'Revenue by Location'
            }
          </h2>
          
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              {chartView === 'daily' ? (
                <LineChart
                  data={chartData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="displayDate" />
                  <YAxis yAxisId="left" orientation="left" tickFormatter={(value: any) => `$${value}`} />
                  <YAxis yAxisId="right" orientation="right" tickFormatter={(value: any) => `${value}`} />
                  <Tooltip formatter={(value: any, name: any) => {
                    if (name === 'revenue' || name === 'target' || name.startsWith('revenue_')) {
                      return [`$${value.toLocaleString()}`, name === 'target' ? 'Target' : 'Revenue'];
                    }
                    return [value.toLocaleString(), 'Customers'];
                  }} />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="revenue"
                    stroke="#2563eb"
                    strokeWidth={2}
                    activeDot={{ r: 8 }}
                    name="Revenue"
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="target"
                    stroke="#f97316"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name="Target"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="customers"
                    stroke="#8b5cf6"
                    name="Customers"
                  />
                </LineChart>
              ) : (
                <BarChart
                  data={chartData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(value: any) => `$${value}`} />
                  <Tooltip formatter={(value: any) => `$${value.toLocaleString()}`} />
                  <Legend />
                  <Bar dataKey="revenue" fill="#2563eb" name="Total Revenue" />
                  <Bar dataKey="target" fill="#f97316" name="Target Revenue" />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Location Performance Table */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Location Performance</h2>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Revenue
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg. Daily Revenue
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Days Above Target
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Customers
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {summaryData.map((location) => (
                  <tr key={location.locationId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{location.locationName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {formatCurrency(location.totalRevenue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {formatCurrency(location.averageRevenue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="mr-2">{location.daysAboveTarget}/{location.totalDays}</span>
                        <div className="w-24 bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-orange-600 h-2.5 rounded-full" 
                            style={{ width: `${(location.daysAboveTarget / location.totalDays) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {location.totalCustomers.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Export button */}
          <div className="mt-4 flex justify-end">
            <button 
              onClick={() => {
                alert('Data export functionality would be implemented here');
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700"
            >
              <span>Export Data</span>
              <Filter size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RevenueDashboardPage;