
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CodeViewer } from './CodeViewer';
import { useToast } from "@/components/ui/use-toast";

interface EdgeFunctionDetailsProps {
  setEdgeFunctionUrl: (url: string) => void;
}

const EdgeFunctionDetails: React.FC<EdgeFunctionDetailsProps> = ({ setEdgeFunctionUrl }) => {
  const [url, setUrl] = useState('');
  const { toast } = useToast();

  const handleSaveUrl = () => {
    if (!url || !url.startsWith('https://')) {
      toast({
        variant: "destructive",
        title: "Invalid URL",
        description: "Please enter a valid HTTPS URL for your Edge Function",
      });
      return;
    }
    
    setEdgeFunctionUrl(url);
    toast({
      title: "Edge Function URL Saved",
      description: "The demo will now use this URL for requests",
    });
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Edge Function Configuration</CardTitle>
          <CardDescription>
            Set up the URL for your Supabase Edge Function
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="edge-url" className="text-sm font-medium">
              Edge Function URL
            </label>
            <div className="flex gap-2">
              <Input 
                id="edge-url" 
                placeholder="https://your-project.supabase.co/functions/v1/ai-assistant" 
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
              <Button onClick={handleSaveUrl}>Save</Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Enter the full URL of your deployed edge function
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Edge Function Implementation</CardTitle>
          <CardDescription>
            Sample code for your Supabase Edge Function
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CodeViewer language="typescript" code={`// supabase/functions/ai-assistant/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { OpenAI } from 'https://esm.sh/openai@4.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Get OpenAI key from Supabase secrets
    const openAIKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIKey) {
      throw new Error('Missing OPENAI_API_KEY');
    }

    // Initialize OpenAI
    const openai = new OpenAI({
      apiKey: openAIKey,
    });

    // Parse request data
    const { systemPrompt, userPrompt, model = 'gpt-4o' } = await req.json();

    // Call OpenAI
    const response = await openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt?.content || 'You are a helpful coding assistant.' },
        { role: 'user', content: userPrompt?.content || '' }
      ],
    });

    // Return response
    return new Response(
      JSON.stringify({
        content: response.choices[0]?.message?.content || '',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});`} />
        </CardContent>
        <CardFooter>
          <p className="text-sm text-muted-foreground">
            Deploy this code to your Supabase project using the Supabase CLI: <code>supabase functions deploy ai-assistant</code>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default EdgeFunctionDetails;
