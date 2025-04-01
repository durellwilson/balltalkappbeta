import { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { useAuth } from '@/hooks/use-auth';
import SubscriptionCard from '@/components/ui/subscription-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { User } from '@shared/schema';
import { CreditCard, Shield, Music, Download, Crown, Star, Zap } from 'lucide-react';

export default function Subscriptions() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  
  // Upgrade subscription mutation
  const upgradeSubscriptionMutation = useMutation({
    mutationFn: async (tier: string) => {
      // Simulate a payment process here
      // In a real application, this would integrate with Stripe or another payment processor
      const res = await apiRequest('POST', `/api/users/${user?.id}/update-subscription`, { 
        subscriptionTier: tier 
      });
      
      return await res.json();
    },
    onSuccess: (data: User) => {
      toast({
        title: 'Subscription Updated',
        description: `Your subscription has been upgraded to ${selectedTier} tier.`,
      });
      
      // Update user data in cache
      queryClient.setQueryData(['/api/user'], data);
      
      // Reset selection
      setSelectedTier(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Upgrade Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  // Handle subscription selection
  const handleSubscribe = (tier: string) => {
    if (tier === user?.subscriptionTier) {
      toast({
        title: 'Already Subscribed',
        description: `You are already subscribed to the ${tier} tier.`,
      });
      return;
    }
    
    setSelectedTier(tier);
    upgradeSubscriptionMutation.mutate(tier);
  };
  
  // Subscription features
  const bronzeFeatures = [
    { text: 'Stream unlimited music', included: true },
    { text: 'Access to basic artist content', included: true },
    { text: 'Ad-supported listening', included: true },
    { text: 'In-app messaging with artists', included: false },
    { text: 'Offline listening', included: false },
    { text: 'High-quality audio', included: false },
    { text: 'Exclusive content access', included: false },
  ];
  
  const silverFeatures = [
    { text: 'Stream unlimited music', included: true },
    { text: 'Access to basic artist content', included: true },
    { text: 'Ad-free listening experience', included: true },
    { text: 'In-app messaging with artists', included: true },
    { text: 'Offline listening', included: false },
    { text: 'High-quality audio', included: true },
    { text: 'Exclusive content access', included: false },
  ];
  
  const goldFeatures = [
    { text: 'Stream unlimited music', included: true },
    { text: 'Access to all artist content', included: true },
    { text: 'Ad-free listening experience', included: true },
    { text: 'In-app messaging with artists', included: true },
    { text: 'Offline listening', included: true },
    { text: 'High-quality audio', included: true },
    { text: 'Exclusive content access', included: true },
  ];
  
  return (
    <MainLayout 
      title="Subscriptions" 
      description="Choose a subscription plan that works for you"
    >
      {/* Current Subscription (if any) */}
      {user?.subscriptionTier && user.subscriptionTier !== 'none' && (
        <Card className="mb-8 border-primary">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Crown className="h-6 w-6 text-primary" />
              <CardTitle>Current Subscription</CardTitle>
            </div>
            <CardDescription>
              You are currently on the {user.subscriptionTier.charAt(0).toUpperCase() + user.subscriptionTier.slice(1)} tier
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-primary/5 p-4 rounded-lg">
              <div className="flex items-center">
                <div className="mr-4">
                  {user.subscriptionTier === 'bronze' && <Star className="h-8 w-8 text-amber-600" />}
                  {user.subscriptionTier === 'silver' && <Star className="h-8 w-8 text-gray-400" />}
                  {user.subscriptionTier === 'gold' && <Crown className="h-8 w-8 text-yellow-500" />}
                </div>
                <div>
                  <h3 className="text-lg font-bold">
                    {user.subscriptionTier.charAt(0).toUpperCase() + user.subscriptionTier.slice(1)} Tier
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Billing starts: {new Date().toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                {user.subscriptionTier === 'bronze' && (
                  <>
                    <div className="flex items-center">
                      <Music className="h-4 w-4 mr-2 text-primary" />
                      <span className="text-sm">Unlimited streaming</span>
                    </div>
                    <div className="flex items-center">
                      <Shield className="h-4 w-4 mr-2 text-primary" />
                      <span className="text-sm">Basic artist content</span>
                    </div>
                    <div className="flex items-center opacity-50">
                      <CreditCard className="h-4 w-4 mr-2" />
                      <span className="text-sm">$4.99/month</span>
                    </div>
                  </>
                )}
                
                {user.subscriptionTier === 'silver' && (
                  <>
                    <div className="flex items-center">
                      <Music className="h-4 w-4 mr-2 text-primary" />
                      <span className="text-sm">Ad-free listening</span>
                    </div>
                    <div className="flex items-center">
                      <Shield className="h-4 w-4 mr-2 text-primary" />
                      <span className="text-sm">Artist messaging</span>
                    </div>
                    <div className="flex items-center opacity-50">
                      <CreditCard className="h-4 w-4 mr-2" />
                      <span className="text-sm">$9.99/month</span>
                    </div>
                  </>
                )}
                
                {user.subscriptionTier === 'gold' && (
                  <>
                    <div className="flex items-center">
                      <Download className="h-4 w-4 mr-2 text-primary" />
                      <span className="text-sm">Offline listening</span>
                    </div>
                    <div className="flex items-center">
                      <Zap className="h-4 w-4 mr-2 text-primary" />
                      <span className="text-sm">Exclusive content</span>
                    </div>
                    <div className="flex items-center opacity-50">
                      <CreditCard className="h-4 w-4 mr-2" />
                      <span className="text-sm">$14.99/month</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      <div className="text-center mb-8">
        <h2 className="text-xl md:text-2xl font-bold mb-2">Choose Your Plan</h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
          Subscribe to unlock premium features and support your favorite athletes
        </p>
      </div>
      
      {/* Subscription Tiers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Bronze Tier */}
        <SubscriptionCard
          title="Bronze"
          price="$4.99"
          description="Basic access to athlete content"
          features={bronzeFeatures}
          onSubscribe={() => handleSubscribe('bronze')}
          className={user?.subscriptionTier === 'bronze' ? 'border-primary' : ''}
        />
        
        {/* Silver Tier */}
        <SubscriptionCard
          title="Silver"
          price="$9.99"
          description="Enhanced access with ad-free experience"
          features={silverFeatures}
          onSubscribe={() => handleSubscribe('silver')}
          isPopular={true}
          className={user?.subscriptionTier === 'silver' ? 'border-primary' : ''}
        />
        
        {/* Gold Tier */}
        <SubscriptionCard
          title="Gold"
          price="$14.99"
          description="Premium experience with exclusive content"
          features={goldFeatures}
          onSubscribe={() => handleSubscribe('gold')}
          className={user?.subscriptionTier === 'gold' ? 'border-primary' : ''}
        />
      </div>
      
      {/* FAQ Section */}
      <div className="mt-16">
        <h2 className="text-xl font-bold mb-6">Frequently Asked Questions</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">What do I get with each subscription tier?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Each tier offers progressively more features. Bronze provides basic streaming, Silver adds ad-free listening and artist messaging, while Gold includes offline listening and exclusive content.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Can I change my subscription?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Yes, you can upgrade or downgrade your subscription at any time. Changes will take effect at the start of your next billing period.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-base">How do I cancel my subscription?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                You can cancel your subscription from your profile settings at any time. Your subscription benefits will remain active until the end of your current billing period.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-base">How do athletes benefit from my subscription?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                A significant portion of subscription revenue goes directly to the athletes based on your listening habits and engagement with their content.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
