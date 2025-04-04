import React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, CreditCard, Shield, Crown, Star, Zap, Music, Calendar, Download, Activity } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export default function SubscriptionsPage() {
  const { user } = useAuth();
  
  // Determine if user has an active subscription
  const hasSubscription = user?.subscription?.status === 'active';
  
  // Current plan details for subscribed users
  const currentPlan = {
    name: 'Athlete Pro',
    price: '$14.99',
    billingCycle: 'monthly',
    nextBillingDate: 'May 15, 2023',
    features: [
      'Unlimited publishing',
      'Premium audio quality (320 kbps)',
      'Advanced analytics',
      'Collaboration tools',
      'Direct fan messaging',
      'Priority support',
      'Custom profile branding'
    ]
  };
  
  // Subscription plan options
  const plans = [
    {
      id: 'basic',
      name: 'Basic',
      description: 'Perfect for fans who want to support their favorite athletes',
      price: '$4.99',
      icon: <Music className="h-6 w-6 text-blue-500" />,
      features: [
        'Ad-free listening',
        'High-quality audio (192 kbps)',
        'Unlimited skips',
        'Support your favorite athletes',
        'Early access to new releases'
      ],
      highlight: false,
      cta: 'Get Started'
    },
    {
      id: 'premium',
      name: 'Premium',
      description: 'The ultimate fan experience with exclusive content',
      price: '$9.99',
      icon: <Star className="h-6 w-6 text-amber-500" />,
      features: [
        'Everything in Basic',
        'Premium audio quality (320 kbps)',
        'Exclusive content access',
        'Offline listening',
        'Personalized playlists',
        'Priority access to live events'
      ],
      highlight: true,
      cta: 'Upgrade Now'
    },
    {
      id: 'athlete',
      name: 'Athlete Pro',
      description: 'For athletes who want to create and share content',
      price: '$14.99',
      icon: <Crown className="h-6 w-6 text-purple-500" />,
      features: [
        'Everything in Premium',
        'Unlimited publishing',
        'Advanced analytics',
        'Collaboration tools',
        'Direct fan messaging',
        'Priority support',
        'Custom profile branding'
      ],
      highlight: false,
      cta: 'Start Creating'
    }
  ];

  // Usage data for subscribed users
  const usageData = [
    { metric: 'Published tracks', value: 24, max: 50, unit: 'tracks' },
    { metric: 'Storage used', value: 2.4, max: 10, unit: 'GB' },
    { metric: 'Monthly plays', value: 12500, max: 'Unlimited', unit: 'plays' },
    { metric: 'Downloads', value: 420, max: 1000, unit: 'downloads' },
  ];
  
  // Payment method for subscribed users
  const paymentMethod = {
    type: 'credit_card',
    brand: 'Visa',
    last4: '4242',
    expiryMonth: 12,
    expiryYear: 2024
  };

  // Calculate progress percentage for usage metrics
  const getProgressPercentage = (value: number, max: number | string) => {
    if (typeof max === 'string') return 100;
    return Math.min(Math.round((value / max) * 100), 100);
  };
  
  return (
    <AppLayout>
      <div className="container mx-auto py-6 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Subscriptions</h1>
            <p className="text-muted-foreground">Manage your plan and billing</p>
          </div>
          
          {hasSubscription && (
            <Badge variant="outline" className="py-1 px-3 border-2 border-primary text-primary flex items-center">
              <Crown className="h-3.5 w-3.5 mr-1" />
              {currentPlan.name}
            </Badge>
          )}
        </div>
        
        <Tabs defaultValue={hasSubscription ? "manage" : "plans"}>
          <TabsList className="mb-6">
            <TabsTrigger value="plans">Plans</TabsTrigger>
            <TabsTrigger value="manage">Manage Subscription</TabsTrigger>
            <TabsTrigger value="billing">Billing History</TabsTrigger>
          </TabsList>
          
          {/* Plans Tab */}
          <TabsContent value="plans">
            <div className="grid gap-6 md:grid-cols-3">
              {plans.map((plan) => (
                <Card key={plan.id} className={`flex flex-col h-full ${plan.highlight ? 'border-primary shadow-md shadow-primary/10' : ''}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <div className="p-2 rounded-full bg-primary/10">{plan.icon}</div>
                      {plan.highlight && (
                        <Badge className="bg-primary hover:bg-primary/90">Popular</Badge>
                      )}
                    </div>
                    <CardTitle>{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                    <div className="mt-4">
                      <span className="text-3xl font-bold">{plan.price}</span>
                      <span className="text-muted-foreground ml-1">/ month</span>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <ul className="space-y-2">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start">
                          <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      variant={plan.highlight ? "default" : "outline"} 
                      className="w-full"
                    >
                      {plan.cta}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          {/* Manage Subscription Tab */}
          <TabsContent value="manage">
            {hasSubscription ? (
              <div className="grid gap-6 md:grid-cols-2">
                {/* Current Plan Card */}
                <Card>
                  <CardHeader>
                    <CardTitle>Current Plan</CardTitle>
                    <CardDescription>Your active subscription details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold flex items-center">
                            {currentPlan.name}
                            <Badge variant="secondary" className="ml-2">Active</Badge>
                          </h3>
                          <p className="text-muted-foreground">Billed {currentPlan.billingCycle}</p>
                        </div>
                        <div className="text-xl font-bold">{currentPlan.price}</div>
                      </div>
                      <div className="mt-4 flex items-center text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4 mr-1" />
                        Next billing date: {currentPlan.nextBillingDate}
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium">Plan Features</h4>
                      <ul className="space-y-1 text-sm">
                        {currentPlan.features.map((feature, i) => (
                          <li key={i} className="flex items-start">
                            <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-col space-y-2">
                    <Button variant="outline" className="w-full">Change Plan</Button>
                    <Button variant="ghost" className="w-full text-destructive hover:text-destructive">
                      Cancel Subscription
                    </Button>
                  </CardFooter>
                </Card>
                
                {/* Usage and Payment Info */}
                <div className="space-y-6">
                  {/* Usage Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Usage</CardTitle>
                      <CardDescription>Your current plan usage</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {usageData.map((item, i) => (
                          <div key={i}>
                            <div className="flex justify-between items-center mb-1">
                              <div className="text-sm font-medium">{item.metric}</div>
                              <div className="text-sm text-muted-foreground">
                                {item.value.toLocaleString()} / {item.max.toLocaleString()} {item.unit}
                              </div>
                            </div>
                            <Progress 
                              value={getProgressPercentage(item.value, item.max)} 
                              className={getProgressPercentage(item.value, item.max) > 80 ? "bg-amber-100" : ""}
                            />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Payment Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Payment Method</CardTitle>
                      <CardDescription>Manage your billing information</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center p-3 border rounded-md">
                        <div className="mr-4">
                          <CreditCard className="h-8 w-8 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">
                            {paymentMethod.brand} •••• {paymentMethod.last4}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Expires {paymentMethod.expiryMonth}/{paymentMethod.expiryYear}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" className="w-full">Update Payment Method</Button>
                    </CardFooter>
                  </Card>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="inline-block p-3 bg-primary/10 rounded-full mb-4">
                  <CreditCard className="h-10 w-10 text-primary" />
                </div>
                <h2 className="text-2xl font-bold mb-2">No Active Subscription</h2>
                <p className="text-muted-foreground max-w-md mx-auto mb-6">
                  You don't have an active subscription. Choose a plan to unlock premium features and support your favorite athletes.
                </p>
                <Button>View Plans</Button>
              </div>
            )}
          </TabsContent>
          
          {/* Billing History Tab */}
          <TabsContent value="billing">
            {hasSubscription ? (
              <Card>
                <CardHeader>
                  <CardTitle>Billing History</CardTitle>
                  <CardDescription>Your payment and invoice history</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <div className="grid grid-cols-5 p-4 bg-muted font-medium text-xs sm:text-sm">
                      <div>Date</div>
                      <div>Description</div>
                      <div>Amount</div>
                      <div>Status</div>
                      <div></div>
                    </div>
                    <div className="divide-y">
                      <div className="grid grid-cols-5 p-4 text-xs sm:text-sm">
                        <div className="text-muted-foreground">Apr 15, 2023</div>
                        <div>Athlete Pro - Monthly</div>
                        <div>${currentPlan.price.replace('$', '')}</div>
                        <div className="flex items-center">
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            Paid
                          </Badge>
                        </div>
                        <div className="text-right">
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-5 p-4 text-xs sm:text-sm">
                        <div className="text-muted-foreground">Mar 15, 2023</div>
                        <div>Athlete Pro - Monthly</div>
                        <div>${currentPlan.price.replace('$', '')}</div>
                        <div className="flex items-center">
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            Paid
                          </Badge>
                        </div>
                        <div className="text-right">
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-5 p-4 text-xs sm:text-sm">
                        <div className="text-muted-foreground">Feb 15, 2023</div>
                        <div>Athlete Pro - Monthly</div>
                        <div>${currentPlan.price.replace('$', '')}</div>
                        <div className="flex items-center">
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            Paid
                          </Badge>
                        </div>
                        <div className="text-right">
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="text-center py-12">
                <div className="inline-block p-3 bg-primary/10 rounded-full mb-4">
                  <Activity className="h-10 w-10 text-primary" />
                </div>
                <h2 className="text-2xl font-bold mb-2">No Billing History</h2>
                <p className="text-muted-foreground max-w-md mx-auto mb-6">
                  You don't have any billing history yet. Subscribe to a plan to see your billing information here.
                </p>
                <Button>View Plans</Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}