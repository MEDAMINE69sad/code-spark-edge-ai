
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { createClient } from '@supabase/supabase-js';
import SubscriptionPlans from './SubscriptionPlans';

// Initialize Supabase client
// You would replace these with actual values in a real app
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const SubscriptionPage: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [userSubscription, setUserSubscription] = useState<any>(null);

  // Check subscription status on component mount
  React.useEffect(() => {
    async function checkSubscription() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          setCurrentPlan('free');
          return;
        }

        const { data, error } = await supabase
          .from('user_subscriptions')
          .select('*')
          .eq('user_id', session.user.id)
          .single();
        
        if (error) {
          console.error('Error fetching subscription:', error);
          setCurrentPlan('free');
          return;
        }
        
        if (data) {
          setUserSubscription(data);
          setCurrentPlan(data.active ? data.plan : 'free');
        } else {
          setCurrentPlan('free');
        }
      } catch (error) {
        console.error('Error checking subscription:', error);
        setCurrentPlan('free');
      }
    }
    
    checkSubscription();
  }, []);

  const handleSelectPlan = async (priceId: string) => {
    setLoading(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Authentication required",
          description: "Please sign in to subscribe to a plan.",
          variant: "destructive",
        });
        
        // Redirect to sign in
        window.location.href = '/signin';
        return;
      }
      
      // Call Supabase Edge Function to create Stripe checkout session
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: { priceId }
      });
      
      if (error) throw error;
      
      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast({
        title: "Subscription error",
        description: "Failed to start subscription process. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">SupaCode AI Subscription Plans</h1>
        <p className="text-muted-foreground">
          Choose the perfect plan for your coding needs
        </p>
      </div>
      
      {currentPlan && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Current Plan: {currentPlan === 'free' ? 'Free' : 'Premium'}</CardTitle>
            <CardDescription>
              {currentPlan === 'free' 
                ? 'Upgrade to Premium for unlimited access to all features and models' 
                : `Your subscription ${userSubscription?.active ? 'is active' : 'has expired'}`}
            </CardDescription>
          </CardHeader>
          {currentPlan !== 'free' && userSubscription?.current_period_end && (
            <CardContent>
              <p className="text-sm">
                {userSubscription?.active 
                  ? `Your subscription will renew on ${new Date(userSubscription.current_period_end).toLocaleDateString()}` 
                  : 'Your subscription has ended. Please renew to continue using premium features.'}
              </p>
            </CardContent>
          )}
        </Card>
      )}
      
      <SubscriptionPlans onSelectPlan={handleSelectPlan} />
      
      <div className="mt-10 border-t pt-10">
        <h2 className="text-xl font-semibold mb-4">Need help?</h2>
        <p className="text-muted-foreground mb-4">
          If you have any questions about our subscription plans or need assistance,
          please contact our support team.
        </p>
        <Button variant="outline">Contact Support</Button>
      </div>
    </div>
  );
};

export default SubscriptionPage;
