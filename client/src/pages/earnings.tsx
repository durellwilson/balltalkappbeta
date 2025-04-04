import React, { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { AppLayout } from '@/components/layout/app-layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { CalendarIcon, Download, DollarSign, TrendingUp, Music, Share2, Users, CreditCard, Gift, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { Separator } from '@/components/ui/separator';

// Mock data for earnings overview
const earningsOverview = {
  totalEarnings: 4250.75,
  pendingPayments: 750.25,
  currentBalance: 1250.50,
  paidOut: 2250.00,
  monthlyGrowth: 15.8,
  nextPayoutDate: '2023-05-15'
};

// Mock data for revenue streams
const revenueStreams = [
  { name: 'Streaming', value: 65, color: '#22c55e' },
  { name: 'Direct Support', value: 20, color: '#3b82f6' },
  { name: 'Licenses', value: 10, color: '#8b5cf6' },
  { name: 'Merch', value: 5, color: '#f43f5e' }
];

// Mock data for monthly earnings
const monthlyEarnings = [
  { month: 'Jan', amount: 320 },
  { month: 'Feb', amount: 380 },
  { month: 'Mar', amount: 420 },
  { month: 'Apr', amount: 450 },
  { month: 'May', amount: 520 },
  { month: 'Jun', amount: 580 },
  { month: 'Jul', amount: 620 },
  { month: 'Aug', amount: 710 },
  { month: 'Sep', amount: 790 },
  { month: 'Oct', amount: 820 },
  { month: 'Nov', amount: 880 },
  { month: 'Dec', amount: 940 },
];

// Mock data for top tracks
const topEarningTracks = [
  { 
    id: 1,
    title: 'Game Day Hype',
    earnings: 425.50,
    plays: 85000,
    directSupport: 120.00,
    licenses: 75.50
  },
  { 
    id: 2,
    title: 'Victory Anthem',
    earnings: 320.25,
    plays: 64000,
    directSupport: 85.00,
    licenses: 50.25
  },
  { 
    id: 3,
    title: 'Pre-Game Ritual',
    earnings: 290.75,
    plays: 58000,
    directSupport: 95.50,
    licenses: 30.25
  },
  { 
    id: 4,
    title: 'Championship Flow',
    earnings: 245.00,
    plays: 49000,
    directSupport: 65.00,
    licenses: 25.00
  },
  { 
    id: 5,
    title: 'Workout Mix Vol. 3',
    earnings: 210.50,
    plays: 42000,
    directSupport: 70.50,
    licenses: 0
  }
];

// Mock data for recent transactions
const recentTransactions = [
  {
    id: 'T123456',
    date: '2023-04-15',
    description: 'Streaming revenue payout',
    amount: 425.50,
    status: 'completed'
  },
  {
    id: 'T123455',
    date: '2023-04-10',
    description: 'License fee - TV commercial',
    amount: 250.00,
    status: 'completed'
  },
  {
    id: 'T123454',
    date: '2023-04-05',
    description: 'Direct support from fans',
    amount: 175.25,
    status: 'completed'
  },
  {
    id: 'T123453',
    date: '2023-04-01',
    description: 'Merchandise sales',
    amount: 85.75,
    status: 'completed'
  },
  {
    id: 'T123452',
    date: '2023-03-25',
    description: 'Streaming revenue payout',
    amount: 390.00,
    status: 'completed'
  },
  {
    id: 'T123451',
    date: '2023-03-20',
    description: 'License fee - Indie film',
    amount: 175.00,
    status: 'completed'
  },
  {
    id: 'T123450',
    date: '2023-03-15',
    description: 'Direct support from fans',
    amount: 150.50,
    status: 'completed'
  },
];

// Mock data for payout history
const payoutHistory = [
  {
    id: 'P789123',
    date: '2023-04-01',
    amount: 850.25,
    method: 'Bank Transfer',
    status: 'completed'
  },
  {
    id: 'P789122',
    date: '2023-03-01',
    amount: 720.50,
    method: 'Bank Transfer',
    status: 'completed'
  },
  {
    id: 'P789121',
    date: '2023-02-01',
    amount: 680.25,
    method: 'Bank Transfer',
    status: 'completed'
  },
];

// Mock data for growth goals
const growthGoals = [
  { 
    name: 'Monthly listeners',
    current: 18500,
    target: 25000,
    progress: (18500/25000) * 100
  },
  { 
    name: 'Total plays',
    current: 350000,
    target: 500000,
    progress: (350000/500000) * 100
  },
  { 
    name: 'Direct supporters',
    current: 85,
    target: 150,
    progress: (85/150) * 100
  },
  { 
    name: 'Licensed tracks',
    current: 3,
    target: 10,
    progress: (3/10) * 100
  },
];

// Format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount);
};

// Format numbers with K/M suffix
const formatNumber = (num: number) => {
  if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
  return num.toString();
};

export default function EarningsPage() {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState<Date | undefined>(new Date());
  const [timePeriod, setTimePeriod] = useState('year');
  
  return (
    <AppLayout>
      <div className="container mx-auto py-6 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Earnings Dashboard</h1>
            <p className="text-muted-foreground">Track your revenue and performance</p>
          </div>
          
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  {dateRange ? format(dateRange, 'MMM yyyy') : 'Select date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={dateRange}
                  onSelect={setDateRange}
                  disabled={(date) => date > new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            
            <Select value={timePeriod} onValueChange={setTimePeriod}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="quarter">This Quarter</SelectItem>
                  <SelectItem value="year">This Year</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
        
        {/* Earnings Overview Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Earnings</p>
                  <h3 className="text-2xl font-bold mt-1">{formatCurrency(earningsOverview.totalEarnings)}</h3>
                  <div className="flex items-center mt-1 text-xs text-green-500 font-medium">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    <span>{earningsOverview.monthlyGrowth}% from last month</span>
                  </div>
                </div>
                <div className="p-2 bg-primary/10 rounded-full">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Current Balance</p>
                  <h3 className="text-2xl font-bold mt-1">{formatCurrency(earningsOverview.currentBalance)}</h3>
                  <div className="flex items-center mt-1 text-xs text-muted-foreground">
                    <CreditCard className="h-3 w-3 mr-1" />
                    <span>Next payout: {earningsOverview.nextPayoutDate}</span>
                  </div>
                </div>
                <div className="p-2 bg-blue-500/10 rounded-full">
                  <CreditCard className="h-5 w-5 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending Payments</p>
                  <h3 className="text-2xl font-bold mt-1">{formatCurrency(earningsOverview.pendingPayments)}</h3>
                  <div className="flex items-center mt-1 text-xs text-amber-500 font-medium">
                    <CalendarIcon className="h-3 w-3 mr-1" />
                    <span>Processing</span>
                  </div>
                </div>
                <div className="p-2 bg-amber-500/10 rounded-full">
                  <CalendarIcon className="h-5 w-5 text-amber-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Paid Out</p>
                  <h3 className="text-2xl font-bold mt-1">{formatCurrency(earningsOverview.paidOut)}</h3>
                  <div className="flex items-center mt-1 text-xs text-muted-foreground">
                    <Music className="h-3 w-3 mr-1" />
                    <span>From all your content</span>
                  </div>
                </div>
                <div className="p-2 bg-green-500/10 rounded-full">
                  <Check className="h-5 w-5 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Tabs defaultValue="overview">
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="content">Content Performance</TabsTrigger>
            <TabsTrigger value="payouts">Payouts</TabsTrigger>
          </TabsList>
          
          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Monthly Earnings Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Earnings</CardTitle>
                  <CardDescription>Your earnings over the past year</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyEarnings} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="month" />
                        <YAxis tickFormatter={(value) => `$${value}`} />
                        <Tooltip formatter={(value) => [`$${value}`, 'Earnings']} />
                        <Bar dataKey="amount" fill="#8884d8" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              {/* Revenue Streams */}
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Streams</CardTitle>
                  <CardDescription>Breakdown of your income sources</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] flex justify-center items-center">
                    <div className="w-full flex flex-col md:flex-row items-center justify-center gap-6">
                      <div className="w-48 h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={revenueStreams}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {revenueStreams.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => [`${value}%`, 'Percentage']} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      
                      <div className="space-y-4">
                        {revenueStreams.map((stream, index) => (
                          <div key={index} className="flex items-center">
                            <div
                              className="w-3 h-3 mr-2 rounded-full"
                              style={{ backgroundColor: stream.color }}
                            />
                            <span className="text-sm mr-2">{stream.name}</span>
                            <span className="text-sm font-medium">{stream.value}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Growth Goals */}
              <Card>
                <CardHeader>
                  <CardTitle>Growth Goals</CardTitle>
                  <CardDescription>Track your progress towards targets</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {growthGoals.map((goal, index) => (
                      <div key={index}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium">{goal.name}</span>
                          <span className="text-sm text-muted-foreground">
                            {formatNumber(goal.current)} / {formatNumber(goal.target)}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <Progress value={goal.progress} />
                          <p className="text-xs text-right text-muted-foreground">
                            {Math.round(goal.progress)}% complete
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    View Analytics
                  </Button>
                </CardFooter>
              </Card>
              
              {/* Monetization Tips */}
              <Card>
                <CardHeader>
                  <CardTitle>Monetization Tips</CardTitle>
                  <CardDescription>Increase your earnings potential</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium flex items-center mb-2">
                      <Users className="h-4 w-4 mr-2 text-blue-500" />
                      Fan Engagement
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Interact with your fans directly to increase support and engagement. Regular live sessions can boost your direct support by up to 35%.
                    </p>
                    <Button variant="link" className="text-xs px-0 text-blue-500">
                      Learn more <ExternalLink className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium flex items-center mb-2">
                      <Music className="h-4 w-4 mr-2 text-green-500" />
                      Content Licensing
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Make your tracks available for licensing to increase revenue streams. Properly tagged and categorized content gets 3x more licensing opportunities.
                    </p>
                    <Button variant="link" className="text-xs px-0 text-green-500">
                      Learn more <ExternalLink className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium flex items-center mb-2">
                      <Share2 className="h-4 w-4 mr-2 text-purple-500" />
                      Cross-promotion
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Collaborate with other athletes and creators to reach new audiences. Collabs have shown to increase earnings by 25% on average.
                    </p>
                    <Button variant="link" className="text-xs px-0 text-purple-500">
                      Learn more <ExternalLink className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Transactions Tab */}
          <TabsContent value="transactions">
            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>Your recent earning activities</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[450px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Transaction ID</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentTransactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell className="font-medium">{transaction.id}</TableCell>
                          <TableCell>{transaction.date}</TableCell>
                          <TableCell>{transaction.description}</TableCell>
                          <TableCell className="text-right">{formatCurrency(transaction.amount)}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              {transaction.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Download Report
                </Button>
                <Button variant="ghost">View All Transactions</Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Content Performance Tab */}
          <TabsContent value="content">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Top Earning Content</CardTitle>
                    <CardDescription>Your best performing tracks and content</CardDescription>
                  </div>
                  <Select defaultValue="earnings">
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Sort by</SelectLabel>
                        <SelectItem value="earnings">Highest Earnings</SelectItem>
                        <SelectItem value="plays">Most Plays</SelectItem>
                        <SelectItem value="support">Direct Support</SelectItem>
                        <SelectItem value="recent">Most Recent</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[450px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Track Title</TableHead>
                        <TableHead>Plays</TableHead>
                        <TableHead>Streaming</TableHead>
                        <TableHead>Direct Support</TableHead>
                        <TableHead>Licenses</TableHead>
                        <TableHead className="text-right">Total Earnings</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topEarningTracks.map((track) => (
                        <TableRow key={track.id}>
                          <TableCell className="font-medium">{track.title}</TableCell>
                          <TableCell>{formatNumber(track.plays)}</TableCell>
                          <TableCell>{formatCurrency(track.earnings - track.directSupport - track.licenses)}</TableCell>
                          <TableCell>{formatCurrency(track.directSupport)}</TableCell>
                          <TableCell>{formatCurrency(track.licenses)}</TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(track.earnings)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  View All Content Performance
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Payouts Tab */}
          <TabsContent value="payouts">
            <div className="grid gap-6 md:grid-cols-3">
              <div className="md:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Payout History</CardTitle>
                    <CardDescription>Record of all completed payouts</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Payout ID</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Method</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payoutHistory.map((payout) => (
                          <TableRow key={payout.id}>
                            <TableCell className="font-medium">{payout.id}</TableCell>
                            <TableCell>{payout.date}</TableCell>
                            <TableCell>{payout.method}</TableCell>
                            <TableCell className="text-right">{formatCurrency(payout.amount)}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                {payout.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Download Statements
                    </Button>
                  </CardFooter>
                </Card>
              </div>
              
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Payout Settings</CardTitle>
                    <CardDescription>Manage your payment information</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-3 border rounded-md flex items-center">
                      <div className="p-2 bg-blue-500/10 rounded-full mr-4">
                        <CreditCard className="h-6 w-6 text-blue-500" />
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">Bank Account</h4>
                        <p className="text-sm text-muted-foreground">
                          Ending in •••• 4567
                        </p>
                      </div>
                      <Button variant="ghost" className="ml-auto" size="sm">
                        Edit
                      </Button>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-sm mb-2">Payout Options</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Minimum payout amount</span>
                          <span className="font-medium">$50.00</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>Payout frequency</span>
                          <span className="font-medium">Monthly</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>Next scheduled payout</span>
                          <span className="font-medium">{earningsOverview.nextPayoutDate}</span>
                        </div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h4 className="font-medium text-sm mb-2">Tax Information</h4>
                      <div className="text-sm text-muted-foreground mb-3">
                        Make sure your tax information is up to date to avoid any payment issues.
                      </div>
                      <Button variant="outline" size="sm">Update Tax Info</Button>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Request Payout</CardTitle>
                    <CardDescription>
                      Current balance: {formatCurrency(earningsOverview.currentBalance)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground mb-6">
                      You can request an immediate payout of your current balance if it exceeds the minimum threshold of $50.
                    </div>
                    <Button className="w-full">
                      Request Payout
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

// Create a Check icon component for the Cards
function Check(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}