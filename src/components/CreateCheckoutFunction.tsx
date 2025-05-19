
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CodeViewer } from './CodeViewer';

const CreateCheckoutFunction: React.FC = () => {
  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>Supabase Edge Function: create-checkout-session</CardTitle>
        <CardDescription>
          This edge function creates a Stripe checkout session for subscriptions
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
  const { priceId } = await req.json()
  
  // Get the authorization header from the request
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'No authorization header' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 401
    })
  }

  try {
    // Initialize the Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || ''
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    
    // Get user from the JWT token
    const token = authHeader.replace('Bearer ', '')
    const { data: userData, error: userError } = await supabase.auth.getUser(token)
    
    if (userError || !userData.user) {
      throw new Error('Invalid user token')
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    })

    // Check if user already has a Stripe customer ID
    const { data: subscriptionData } = await supabase
      .from('user_subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', userData.user.id)
      .single()

    let customerId = subscriptionData?.stripe_customer_id
    
    // If no customer ID exists, create a new Stripe customer
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userData.user.email,
        metadata: {
          user_id: userData.user.id
        }
      })
      
      customerId = customer.id
      
      // Store the customer ID in Supabase
      await supabase
        .from('user_subscriptions')
        .upsert({
          user_id: userData.user.id,
          stripe_customer_id: customerId,
          active: false,
          plan: 'free',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
    }

    // Create the Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: \`\${req.headers.get('origin')}/subscription/success?session_id={CHECKOUT_SESSION_ID}\`,
      cancel_url: \`\${req.headers.get('origin')}/subscription/cancel\`,
    })

    // Return the session URL
    return new Response(JSON.stringify({ url: session.url }), {
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

export default CreateCheckoutFunction;
