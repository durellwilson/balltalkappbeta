import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Download, CreditCard, RefreshCcw, TrendingUp, Play, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from 'recharts';

const earningsData = [
  { date: 'Jan', streaming: 1200, downloads: 400, subscriptions: 800, total: 2400 },
  { date: 'Feb', streaming: 1800, downloads: 600, subscriptions: 900, total: 3300 },
  { date: 'Mar', streaming: 1400, downloads: 300, subscriptions: 950, total: 2650 },
  { date: 'Apr', streaming: 2000, downloads: 700, subscriptions: 1000, total: 3700 },
  { date: 'May', streaming: 2400, downloads: 900, subscriptions: 1100, total: 4400 },
  { date: 'Jun', streaming: 1800, downloads: 500, subscriptions: 1050, total: 3350 },
  { date: 'Jul', streaming: 2800, downloads: 1200, subscriptions: 1200, total: 5200 },
  { date: 'Aug', streaming: 3000, downloads: 1000, subscriptions: 1300, total: 5300 },
  { date: 'Sep', streaming: 2500, downloads: 800, subscriptions: 1250, total: 4550 },
  { date: 'Oct', streaming: 3500, downloads: 1500, subscriptions: 1400, total: 6400 },
  { date: 'Nov', streaming: 3200, downloads: 1300, subscriptions: 1450, total: 5950 },
  { date: 'Dec', streaming: 4000, downloads: 1800, subscriptions: 1500, total: 7300 },
];

// Custom tooltip for charts
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border border-border p-3 rounded-md shadow-md">
        <p className="font-semibold mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={`item-${index}`} style={{ color: entry.color }} className="text-sm flex items-center">
            <span className="mr-2 inline-block w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></span>
            <span className="mr-2">{entry.name}:</span>
            <span className="font-medium">${entry.value.toLocaleString()}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Transaction item component
const TransactionItem = ({ track, revenue, date, type, listeners }: { track: string, revenue: number, date: string, type: string, listeners: number }) => (
  <div className="flex justify-between items-center p-4 hover:bg-accent rounded-md transition-colors">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center">
        <Play className="h-5 w-5 text-foreground" />
      </div>
      <div>
        <p className="font-medium">{track}</p>
        <p className="text-xs text-muted-foreground">{type} • {listeners.toLocaleString()} listeners</p>
      </div>
    </div>
    <div className="text-right">
      <p className="font-semibold">${revenue.toFixed(2)}</p>
      <p className="text-xs text-muted-foreground">{date}</p>
    </div>
  </div>
);

export default function EarningsPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [dateRange, setDateRange] = useState({
    from: new Date(2023, 0, 1),
    to: new Date(),
  });

  // Simulated data for recent transactions
  const recentTransactions = [
    { track: "Pre-Game Pump Up", revenue: 240.50, date: "Today", type: "Streaming", listeners: 12500 },
    { track: "Victory Anthem", revenue: 180.75, date: "Yesterday", type: "Download", listeners: 8900 },
    { track: "Championship Flow", revenue: 320.25, date: "2 days ago", type: "Subscription", listeners: 15200 },
    { track: "Game Day Focus", revenue: 150.30, date: "3 days ago", type: "Streaming", listeners: 7800 },
    { track: "Athlete Motivation", revenue: 195.60, date: "4 days ago", type: "Download", listeners: 10300 },
  ];

  return (
    <AppLayout>
      <div className="container mx-auto py-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold">Earnings</h1>
            <p className="text-muted-foreground">Track your revenue and payment history</p>
          </div>
          <div className="flex items-center gap-3">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start text-left font-normal w-[240px]">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd, yyyy")} - {format(dateRange.to, "LLL dd, yyyy")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, yyyy")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange.from}
                  selected={dateRange}
                  onSelect={(range: any) => setDateRange(range)}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Earnings</CardDescription>
              <CardTitle className="text-3xl">$54,350.75</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-xs text-green-500 font-medium">
                <TrendingUp className="h-3 w-3 mr-1" />
                <span>24.5% from last month</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Streaming Revenue</CardDescription>
              <CardTitle className="text-3xl">$28,600.50</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-xs text-green-500 font-medium">
                <TrendingUp className="h-3 w-3 mr-1" />
                <span>18.2% from last month</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Download Revenue</CardDescription>
              <CardTitle className="text-3xl">$10,800.25</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-xs text-green-500 font-medium">
                <TrendingUp className="h-3 w-3 mr-1" />
                <span>12.8% from last month</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Subscription Revenue</CardDescription>
              <CardTitle className="text-3xl">$14,950.00</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-xs text-green-500 font-medium">
                <TrendingUp className="h-3 w-3 mr-1" />
                <span>32.4% from last month</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts & Transactions */}
        <div className="grid gap-6 md:grid-cols-8">
          {/* Left Column - Charts */}
          <div className="md:col-span-5 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Overview</CardTitle>
                <CardDescription>Your earnings breakdown by category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={earningsData}
                      margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
                    >
                      <defs>
                        <linearGradient id="colorStreaming" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorDownloads" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorSubscriptions" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ffc658" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#ffc658" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="streaming" stroke="#8884d8" fillOpacity={1} fill="url(#colorStreaming)" name="Streaming" />
                      <Area type="monotone" dataKey="downloads" stroke="#82ca9d" fillOpacity={1} fill="url(#colorDownloads)" name="Downloads" />
                      <Area type="monotone" dataKey="subscriptions" stroke="#ffc658" fillOpacity={1} fill="url(#colorSubscriptions)" name="Subscriptions" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monthly Comparison</CardTitle>
                <CardDescription>Total earnings by month</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={earningsData}
                      margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="total" name="Total Earnings" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Transactions */}
          <div className="md:col-span-3 space-y-6">
            <Card className="h-full flex flex-col">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Recent Transactions</CardTitle>
                    <CardDescription>Your latest earnings activity</CardDescription>
                  </div>
                  <Button variant="ghost" size="icon">
                    <RefreshCcw className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex-grow overflow-auto">
                <div className="space-y-1">
                  {recentTransactions.map((transaction, index) => (
                    <TransactionItem key={index} {...transaction} />
                  ))}
                </div>
              </CardContent>
              <div className="p-4 border-t">
                <Button variant="outline" className="w-full">
                  <CreditCard className="mr-2 h-4 w-4" />
                  View All Transactions
                </Button>
              </div>
            </Card>
          </div>
        </div>

        {/* Payout Section */}
        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Payout Information</CardTitle>
              <CardDescription>Manage your payment methods and schedule</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="history">
                <TabsList className="mb-4">
                  <TabsTrigger value="history">Payment History</TabsTrigger>
                  <TabsTrigger value="methods">Payment Methods</TabsTrigger>
                  <TabsTrigger value="schedule">Payout Schedule</TabsTrigger>
                </TabsList>
                
                <TabsContent value="history">
                  <div className="rounded-md border">
                    <div className="grid grid-cols-5 p-4 bg-muted font-medium">
                      <div>Date</div>
                      <div>Reference</div>
                      <div>Amount</div>
                      <div>Method</div>
                      <div>Status</div>
                    </div>
                    <div className="divide-y">
                      <div className="grid grid-cols-5 p-4">
                        <div className="text-muted-foreground">Nov 1, 2023</div>
                        <div>#PAY-2023110178</div>
                        <div>$6,450.75</div>
                        <div>Direct Deposit</div>
                        <div className="text-green-500">Completed</div>
                      </div>
                      <div className="grid grid-cols-5 p-4">
                        <div className="text-muted-foreground">Oct 1, 2023</div>
                        <div>#PAY-2023100145</div>
                        <div>$5,920.50</div>
                        <div>Direct Deposit</div>
                        <div className="text-green-500">Completed</div>
                      </div>
                      <div className="grid grid-cols-5 p-4">
                        <div className="text-muted-foreground">Sep 1, 2023</div>
                        <div>#PAY-2023090132</div>
                        <div>$4,580.25</div>
                        <div>Direct Deposit</div>
                        <div className="text-green-500">Completed</div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="methods">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Card className="border-2 border-primary">
                      <CardHeader>
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-lg">Direct Deposit</CardTitle>
                          <div className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary">
                            <span>✓</span>
                          </div>
                        </div>
                        <CardDescription>Primary payment method</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <p className="text-sm text-muted-foreground">Account Type</p>
                            <p className="text-sm font-medium">Checking</p>
                          </div>
                          <div className="flex justify-between">
                            <p className="text-sm text-muted-foreground">Bank</p>
                            <p className="text-sm font-medium">Bank of America</p>
                          </div>
                          <div className="flex justify-between">
                            <p className="text-sm text-muted-foreground">Account</p>
                            <p className="text-sm font-medium">••••4587</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="border border-dashed flex items-center justify-center">
                      <CardContent className="text-center py-8">
                        <Button variant="outline">
                          <Plus className="mr-2 h-4 w-4" />
                          Add Payment Method
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
                
                <TabsContent value="schedule">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <h3 className="text-lg font-medium mb-2">Current Payout Schedule</h3>
                      <p className="text-muted-foreground mb-4">
                        You are currently set to receive payments on the 1st of each month, 
                        provided your balance exceeds the minimum threshold of $50.
                      </p>
                      <Button>Change Schedule</Button>
                    </div>
                    <Card>
                      <CardHeader>
                        <CardTitle>Next Payout</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <p className="text-muted-foreground">Date</p>
                            <p className="font-medium">Dec 1, 2023</p>
                          </div>
                          <div className="flex justify-between">
                            <p className="text-muted-foreground">Estimated Amount</p>
                            <p className="font-medium">$7,250.50</p>
                          </div>
                          <div className="flex justify-between">
                            <p className="text-muted-foreground">Method</p>
                            <p className="font-medium">Direct Deposit</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}