
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CodeViewer } from './CodeViewer';

const DatabaseSchema: React.FC = () => {
  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>Supabase Database Schema</CardTitle>
        <CardDescription>
          SQL schema for user subscriptions and request tracking
        </CardDescription>
      </CardHeader>
      <CardContent>
        <CodeViewer 
          language="sql" 
          code={`-- Create subscription and user related tables

-- User subscriptions table
CREATE TABLE public.user_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    active BOOLEAN DEFAULT false,
    plan TEXT DEFAULT 'free',
    requests_log JSONB DEFAULT '{}',
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create RLS policies
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can only read their own subscription data
CREATE POLICY "Users can view their own subscriptions"
  ON public.user_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Function to increment daily request count
CREATE OR REPLACE FUNCTION increment_daily_requests(user_id UUID, request_date TEXT)
RETURNS VOID AS $$
DECLARE
    current_requests INTEGER;
    requests_obj JSONB;
BEGIN
    -- Get current subscription record
    SELECT requests_log INTO requests_obj 
    FROM public.user_subscriptions 
    WHERE user_id = increment_daily_requests.user_id;
    
    -- Initialize if needed
    IF requests_obj IS NULL THEN
        requests_obj := '{}'::JSONB;
    END IF;
    
    -- Get current count for today
    IF (requests_obj ? request_date) THEN
        current_requests := (requests_obj->>request_date)::INTEGER;
    ELSE
        current_requests := 0;
    END IF;
    
    -- Increment count
    requests_obj := jsonb_set(
        requests_obj, 
        ARRAY[request_date], 
        to_jsonb(current_requests + 1)
    );
    
    -- Update user subscription
    UPDATE public.user_subscriptions 
    SET requests_log = requests_obj,
        updated_at = now()
    WHERE user_id = increment_daily_requests.user_id;
    
    -- Insert a record if none exists (for free users)
    IF NOT FOUND THEN
        INSERT INTO public.user_subscriptions (
            user_id, 
            active, 
            plan, 
            requests_log
        ) VALUES (
            increment_daily_requests.user_id,
            false,
            'free',
            jsonb_build_object(request_date, 1)
        );
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Payment history table
CREATE TABLE public.payment_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    stripe_invoice_id TEXT,
    amount DECIMAL(10,2),
    currency TEXT DEFAULT 'usd',
    status TEXT,
    payment_date TIMESTAMPTZ,
    subscription_id UUID REFERENCES public.user_subscriptions(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Apply RLS to payment history
ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;

-- Users can only read their own payment history
CREATE POLICY "Users can view their own payment history"
  ON public.payment_history FOR SELECT
  USING (auth.uid() = user_id);

-- Function to reset daily request counts (run daily via cron)
CREATE OR REPLACE FUNCTION reset_daily_requests()
RETURNS VOID AS $$
BEGIN
    UPDATE public.user_subscriptions
    SET requests_log = '{}',
        updated_at = now();
END;
$$ LANGUAGE plpgsql;`} 
        />
      </CardContent>
    </Card>
  );
};

export default DatabaseSchema;
