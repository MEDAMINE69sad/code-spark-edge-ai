
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import VSCodeExtensionDemo from '@/components/VSCodeExtensionDemo';
import ExtensionSetup from '@/components/ExtensionSetup';
import EdgeFunctionDetails from '@/components/EdgeFunctionDetails';
import { Badge } from "@/components/ui/badge";
import ConfigurationDetails from "@/components/ConfigurationDetails";

const Index = () => {
  const [edgeFunctionUrl, setEdgeFunctionUrl] = useState('');

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold tracking-tight mb-2">SupaCode Assistant</h1>
        <p className="text-lg text-muted-foreground mb-4">
          A VS Code extension powered by Supabase Edge Functions
        </p>
        <div className="flex justify-center gap-2">
          <Badge variant="outline" className="bg-slate-100">AI-Powered</Badge>
          <Badge variant="outline" className="bg-slate-100">Supabase</Badge>
          <Badge variant="outline" className="bg-slate-100">VS Code</Badge>
        </div>
      </div>

      <Tabs defaultValue="demo" className="w-full">
        <TabsList className="grid grid-cols-4 max-w-lg mx-auto mb-6">
          <TabsTrigger value="demo">Demo</TabsTrigger>
          <TabsTrigger value="setup">Setup</TabsTrigger>
          <TabsTrigger value="edge-function">Edge Function</TabsTrigger>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
        </TabsList>
        
        <TabsContent value="demo" className="space-y-6">
          <VSCodeExtensionDemo edgeFunctionUrl={edgeFunctionUrl} />
        </TabsContent>
        
        <TabsContent value="setup" className="space-y-6">
          <ExtensionSetup />
        </TabsContent>
        
        <TabsContent value="edge-function" className="space-y-6">
          <EdgeFunctionDetails setEdgeFunctionUrl={setEdgeFunctionUrl} />
        </TabsContent>
        
        <TabsContent value="configuration" className="space-y-6">
          <ConfigurationDetails />
        </TabsContent>
      </Tabs>

      <Separator className="my-8" />
      
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-4">Getting Started</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>1. Create Edge Function</CardTitle>
              <CardDescription>Deploy your AI handler in Supabase</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">Deploy an edge function in Supabase that handles your AI requests securely.</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>2. Install Extension</CardTitle>
              <CardDescription>Add to VS Code</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">Install the extension in VS Code and configure the edge function URL.</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>3. Start Coding</CardTitle>
              <CardDescription>Use AI assistance</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">Get code completions, explanations, refactoring, and more while you code.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
