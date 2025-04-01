import { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { formatCurrency } from '@/lib/utils';
import { DollarSign, Download, Users, Clock, Calendar, Music } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function Earnings() {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState('30days');
  
  // Fetch user's tracks
  const { data: tracks } = useQuery({
    queryKey: ['/api/tracks/artist', user?.id],
    queryFn: async () => {
      const res = await fetch(`/api/tracks/artist/${user?.id}`);
      if (!res.ok) throw new Error('Failed to fetch tracks');
      return res.json();
    },
    enabled: !!user?.id,
  });

  // Mock data for earnings charts
  const revenueData = [
    { name: 'Jan', streams: 1200, subscribers: 800, total: 2000 },
    { name: 'Feb', streams: 1500, subscribers: 900, total: 2400 },
    { name: 'Mar', streams: 1800, subscribers: 1200, total: 3000 },
    { name: 'Apr', streams: 2200, subscribers: 1400, total: 3600 },
    { name: 'May', streams: 2500, subscribers: 1600, total: 4100 },
    { name: 'Jun', streams: 2800, subscribers: 1700, total: 4500 },
  ];

  const revenueSourceData = [
    { name: 'Streams', value: 60 },
    { name: 'Subscriptions', value: 30 },
    { name: 'Tips', value: 10 },
  ];

  const subscriberTierData = [
    { name: 'Bronze', value: 50 },
    { name: 'Silver', value: 30 },
    { name: 'Gold', value: 20 },
  ];

  const revenueByTrack = [
    { name: 'Track 1', revenue: 1200 },
    { name: 'Track 2', revenue: 800 },
    { name: 'Track 3', revenue: 600 },
    { name: 'Track 4', revenue: 450 },
    { name: 'Track 5', revenue: 320 },
  ];

  const paymentHistoryData = [
    { id: 1, date: '2023-05-01', amount: 1250.00, status: 'Completed' },
    { id: 2, date: '2023-04-01', amount: 980.50, status: 'Completed' },
    { id: 3, date: '2023-03-01', amount: 750.25, status: 'Completed' },
  ];

  // Colors for charts
  const COLORS = ['#3C5CCF', '#9747FF', '#4CAF50', '#FFC107'];

  return (
    <MainLayout 
      title="Earnings Dashboard" 
      description="Track your revenue, subscribers, and streaming performance"
    >
      <div className="mb-6 flex justify-end">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">Time Range:</span>
          <Select defaultValue={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 Days</SelectItem>
              <SelectItem value="30days">Last 30 Days</SelectItem>
              <SelectItem value="90days">Last 90 Days</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
              <SelectItem value="alltime">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="mr-4 p-3 rounded-full bg-primary/10 text-primary">
                <DollarSign className="h-8 w-8" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Earnings</p>
                <h3 className="text-2xl font-bold">{formatCurrency(12450.75)}</h3>
                <p className="text-xs text-green-600">+8.2% from last month</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="mr-4 p-3 rounded-full bg-purple-500/10 text-purple-500">
                <Users className="h-8 w-8" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Subscribers</p>
                <h3 className="text-2xl font-bold">1,024</h3>
                <p className="text-xs text-green-600">+4.5% from last month</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="mr-4 p-3 rounded-full bg-green-500/10 text-green-500">
                <Music className="h-8 w-8" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Track Streams</p>
                <h3 className="text-2xl font-bold">183.2K</h3>
                <p className="text-xs text-green-600">+12.3% from last month</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="mr-4 p-3 rounded-full bg-yellow-500/10 text-yellow-500">
                <Clock className="h-8 w-8" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg. Listen Time</p>
                <h3 className="text-2xl font-bold">2:45</h3>
                <p className="text-xs text-green-600">+2.1% from last month</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Earnings Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-8">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tracks">Tracks</TabsTrigger>
          <TabsTrigger value="subscribers">Subscribers</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Revenue Over Time</CardTitle>
                <CardDescription>Monthly earnings breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={revenueData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`$${value}`, '']} />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="total"
                        stroke="#3C5CCF"
                        activeDot={{ r: 8 }}
                        strokeWidth={2}
                      />
                      <Line type="monotone" dataKey="streams" stroke="#9747FF" />
                      <Line type="monotone" dataKey="subscribers" stroke="#4CAF50" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Revenue Sources</CardTitle>
                <CardDescription>Breakdown by source</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={revenueSourceData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {revenueSourceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value}%`, '']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Tracks Tab */}
        <TabsContent value="tracks">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Track</CardTitle>
                <CardDescription>Top earning tracks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={revenueByTrack}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
                      <Bar dataKey="revenue" fill="#3C5CCF" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Track Performance</CardTitle>
                <CardDescription>Streams and engagement</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {tracks && tracks.slice(0, 5).map((track: any, index: number) => (
                    <div key={track.id} className="flex items-center">
                      <div className="flex-shrink-0 w-10 text-center">
                        <span className="text-lg font-medium text-gray-500 dark:text-gray-400">{index + 1}</span>
                      </div>
                      <div className="flex-shrink-0 h-10 w-10 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center mr-3">
                        {track.coverArt ? (
                          <img className="h-10 w-10 rounded object-cover" src={track.coverArt} alt={track.title} />
                        ) : (
                          <Music className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-medium truncate">{track.title}</h4>
                        <div className="flex items-center mt-1">
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full" 
                              style={{ width: `${Math.min(100, (track.plays / 1000) * 100)}%` }}
                            ></div>
                          </div>
                          <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">{track.plays || 0} plays</span>
                        </div>
                      </div>
                      <div className="flex-shrink-0 ml-4">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatCurrency((track.plays || 0) * 0.005)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Subscribers Tab */}
        <TabsContent value="subscribers">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Subscriber Growth</CardTitle>
                <CardDescription>Monthly subscriber count</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={revenueData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="subscribers"
                        stroke="#9747FF"
                        activeDot={{ r: 8 }}
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Subscribers by Tier</CardTitle>
                <CardDescription>Breakdown by subscription level</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={subscriberTierData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {subscriberTierData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value}%`, '']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Payments Tab */}
        <TabsContent value="payments">
          <div className="grid grid-cols-1 gap-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Payment History</CardTitle>
                  <CardDescription>Recent payments to your account</CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs uppercase bg-gray-50 dark:bg-gray-800">
                        <tr>
                          <th scope="col" className="px-6 py-3">Date</th>
                          <th scope="col" className="px-6 py-3">Reference</th>
                          <th scope="col" className="px-6 py-3">Amount</th>
                          <th scope="col" className="px-6 py-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {paymentHistoryData.map(payment => (
                          <tr key={payment.id} className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800">
                            <td className="px-6 py-4 whitespace-nowrap">
                              {new Date(payment.date).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              #{payment.id.toString().padStart(6, '0')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap font-medium">
                              {formatCurrency(payment.amount)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                                {payment.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                        
                        {/* Next Scheduled Payment */}
                        <tr className="bg-gray-50 dark:bg-gray-800">
                          <td className="px-6 py-4 whitespace-nowrap">
                            {new Date(new Date().setDate(new Date().getDate() + 15)).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            Scheduled
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap font-medium">
                            {formatCurrency(1425.50)} (Estimated)
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                              Pending
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                
                <div className="mt-6 bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <h4 className="text-sm font-medium mb-2">Payment Schedule</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Payments are processed on the 1st of each month for the previous month's earnings.
                    A minimum balance of $50 is required for payout.
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
                <CardDescription>Manage your payment settings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border p-4 mb-4 bg-white dark:bg-gray-900">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="mr-4 p-2 rounded-md bg-primary/10">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-primary">
                          <path d="M4.5 3.75a3 3 0 00-3 3v.75h21v-.75a3 3 0 00-3-3h-15z" />
                          <path fillRule="evenodd" d="M22.5 9.75h-21v7.5a3 3 0 003 3h15a3 3 0 003-3v-7.5zm-18 3.75a.75.75 0 01.75-.75h6a.75.75 0 010 1.5h-6a.75.75 0 01-.75-.75zm.75 2.25a.75.75 0 000 1.5h3a.75.75 0 000-1.5h-3z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-medium">Bank Account</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Ending in •••• 4532
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      Change
                    </Button>
                  </div>
                </div>
                
                <div className="text-center">
                  <Button variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Payment Method
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
}
