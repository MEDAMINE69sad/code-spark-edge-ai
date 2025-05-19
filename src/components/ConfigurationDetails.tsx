
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

const ConfigurationDetails = () => {
  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Extension Configuration</CardTitle>
          <CardDescription>
            Configure your VS Code extension settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Setting</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Default</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">edgeFunctionUrl</TableCell>
                <TableCell>URL of your Supabase Edge Function for AI requests</TableCell>
                <TableCell><Badge variant="outline" className="bg-red-50">Required</Badge></TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">model</TableCell>
                <TableCell>AI model to use for code generation</TableCell>
                <TableCell>gpt-4o</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">apiKey</TableCell>
                <TableCell>Optional API key for authentication with your Edge Function</TableCell>
                <TableCell>Empty</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">inlineCompletions</TableCell>
                <TableCell>Enable AI-powered inline code completions</TableCell>
                <TableCell>true</TableCell>
              </TableRow>
            </TableBody>
          </Table>

          <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
            <h3 className="text-sm font-medium text-amber-800 mb-2">Security Note</h3>
            <p className="text-sm text-amber-700">
              The extension uses your Supabase Edge Function for all AI operations. Your API keys are stored securely in VS Code settings and never sent to any third-party service.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Features Comparison</CardTitle>
          <CardDescription>
            How SupaCode Assistant compares to similar tools
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Feature</TableHead>
                <TableHead>SupaCode Assistant</TableHead>
                <TableHead>GitHub Copilot</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Code Completion</TableCell>
                <TableCell>✅</TableCell>
                <TableCell>✅</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Code Explanation</TableCell>
                <TableCell>✅</TableCell>
                <TableCell>✅</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Refactoring</TableCell>
                <TableCell>✅</TableCell>
                <TableCell>✅</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Documentation Generation</TableCell>
                <TableCell>✅</TableCell>
                <TableCell>Limited</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Test Generation</TableCell>
                <TableCell>✅</TableCell>
                <TableCell>Limited</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Custom AI Backend</TableCell>
                <TableCell>✅</TableCell>
                <TableCell>❌</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Self-Hosted Option</TableCell>
                <TableCell>✅</TableCell>
                <TableCell>❌</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Customizable Prompts</TableCell>
                <TableCell>✅</TableCell>
                <TableCell>❌</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConfigurationDetails;
