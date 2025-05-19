
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { createClient } from '@supabase/supabase-js';
import { CheckCircle } from "lucide-react";

const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const SubscriptionSuccess: React.FC = () => {
  const { toast } = useToast();
  const [verifying, setVerifying] = useState(true);
  const [subscription, setSubscription] = useState<any>(null);

  useEffect(() => {
    async function verifySubscription() {
      try {
        // Get session ID from URL
        const params = new URLSearchParams(window.location.search);
        const sessionId = params.get('session_id');
        
        if (!sessionId) {
          setVerifying(false);
          return;
        }
        
        // Call verification edge function
        const { data, error } = await supabase.functions.invoke('verify-subscription', {
          body: { sessionId }
        });
        
        if (error) {
          throw error;
        }
        
        setSubscription(data.subscription);
        toast({
          title: "Subscription activated!",
          description: "Your premium subscription has been successfully activated.",
          variant: "default",
        });
      } catch (error) {
        console.error('Error verifying subscription:', error);
        toast({
          title: "Verification error",
          description: "Could not verify your subscription. Please contact support.",
          variant: "destructive",
        });
      } finally {
        setVerifying(false);
      }
    }
    
    verifySubscription();
  }, [toast]);

  return (
    <div className="container mx-auto py-20 max-w-md">
      <Card>
        <CardHeader className="text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
          <CardTitle>Subscription Successful!</CardTitle>
          <CardDescription>
            Thank you for subscribing to SupaCode AI Premium
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {verifying ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-sm text-muted-foreground">Verifying your subscription...</p>
            </div>
          ) : (
            <>
              {subscription && (
                <div className="text-center py-2">
                  <p className="font-semibold">
                    {subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)} Plan
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Valid until {new Date(subscription.current_period_end).toLocaleDateString()}
                  </p>
                </div>
              )}
              <div className="text-sm space-y-2">
                <p>You now have access to:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Premium AI models including GPT-4o</li>
                  <li>Unlimited requests</li>
                  <li>Advanced code completion</li>
                  <li>Advanced refactoring and test generation</li>
                </ul>
              </div>
              <div className="pt-4 flex justify-center">
                <Button onClick={() => window.location.href = '/'}>
                  Back to Home
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionSuccess;
