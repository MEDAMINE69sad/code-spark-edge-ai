
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CodeViewer } from './CodeViewer';

const VerifySubscriptionFunction: React.FC = () => {
  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>Supabase Edge Function: verify-subscription</CardTitle>
        <CardDescription>
          This edge function verifies a Stripe subscription status
        </CardDescription>
      </CardHeader>
      <CardContent>
        <CodeViewer 
          language="typescript" 
          code={`import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"
import Stripe from "https://esm.sh/stripe@14.21.0"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders })
  }

  // Get the request body
  const { sessionId } = await req.json()
  
  // Get the authorization header from the request
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'No authorization header' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 401
    })
  }

  try {
    // Initialize the Supabase client with service role key for admin operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '' 
    const supabase = createClient(supabaseUrl, supabaseServiceKey, { 
      auth: { persistSession: false } 
    })
    
    // Also initialize with anon key to validate the user's token
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || ''
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey)
    
    // Get user from the JWT token
    const token = authHeader.replace('Bearer ', '')
    const { data: userData, error: userError } = await supabaseAuth.auth.getUser(token)
    
    if (userError || !userData.user) {
      throw new Error('Invalid user token')
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    })

    // Retrieve the session
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    
    if (!session || session.payment_status !== 'paid') {
      throw new Error('Invalid or unpaid session')
    }
    
    // Retrieve the subscription
    const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
    
    // Update the subscription in the database
    await supabase
      .from('user_subscriptions')
      .update({
        stripe_subscription_id: subscription.id,
        active: subscription.status === 'active',
        plan: 'premium',
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userData.user.id)

    return new Response(JSON.stringify({ 
      success: true,
      subscription: {
        active: subscription.status === 'active',
        plan: 'premium',
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString()
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})`} 
        />
      </CardContent>
    </Card>
  );
};

export default VerifySubscriptionFunction;
