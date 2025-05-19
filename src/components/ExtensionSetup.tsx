
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CodeViewer } from './CodeViewer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ExtensionSetup = () => {
  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Extension Code</CardTitle>
          <CardDescription>
            VS Code extension code that uses n8n webhooks for AI functionality
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="main">
            <TabsList className="mb-4">
              <TabsTrigger value="main">Main</TabsTrigger>
              <TabsTrigger value="commands">Commands</TabsTrigger>
              <TabsTrigger value="package">package.json</TabsTrigger>
              <TabsTrigger value="subscription">Subscription</TabsTrigger>
            </TabsList>
            <TabsContent value="main">
              <CodeViewer language="typescript" code={`import * as vscode from 'vscode';
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';
const supabase = createClient(supabaseUrl, supabaseKey);

// Helper function to validate configuration
function validateConfig(): boolean {
    const config = vscode.workspace.getConfiguration('supaCodeAssistant');
    const completionWebhook = config.get<string>('completionWebhook');

    if (!completionWebhook) {
        vscode.window.showErrorMessage('Please configure your webhook URLs in settings');
        return false;
    }

    return true;
}

// Helper function to handle errors
function handleError(error: Error, message: string): Promise<never> {
    console.error(error);
    vscode.window.showErrorMessage(\`\${message}: \${error.message}\`);
    return Promise.reject(error);
}

// User subscription state
let userSubscription = {
    active: false,
    plan: 'free',
    requestsToday: 0,
    dailyLimit: 100,
    model: 'gemini-pro-2.5'
};

// Check user subscription status
async function checkSubscription() {
    try {
        const session = await supabase.auth.getSession();
        if (!session.data.session) {
            userSubscription = {
                active: false,
                plan: 'free',
                requestsToday: 0,
                dailyLimit: 100,
                model: 'gemini-pro-2.5'
            };
            return;
        }
        
        const { data, error } = await supabase
            .from('user_subscriptions')
            .select('*')
            .eq('user_id', session.data.session.user.id)
            .single();
            
        if (error) {
            console.error('Error fetching subscription:', error);
            return;
        }
        
        if (data) {
            const today = new Date().toISOString().split('T')[0];
            userSubscription = {
                active: data.active,
                plan: data.active ? 'premium' : 'free',
                requestsToday: data.requests_log && data.requests_log[today] ? data.requests_log[today] : 0,
                dailyLimit: data.active ? Infinity : 100,
                model: data.active ? 'gpt-4o' : 'gemini-pro-2.5'
            };
        }
        
        // Update status bar to reflect subscription
        updateStatusBar();
    } catch (error) {
        console.error('Failed to check subscription:', error);
    }
}

// Helper function to call AI via n8n webhook
async function callAI(webhookUrl: string, systemPrompt: string, userPrompt: string): Promise<string> {
    if (!userSubscription.active && userSubscription.requestsToday >= userSubscription.dailyLimit) {
        throw new Error('You have reached your daily limit for free users. Please upgrade to premium.');
    }
    
    try {
        const config = vscode.workspace.getConfiguration('supaCodeAssistant');
        const apiKey = config.get<string>('apiKey') || '';
        const selectedModel = config.get<string>('model') || userSubscription.model;
        
        // Check if user is trying to use a premium model on free tier
        const premiumModels = ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'];
        if (!userSubscription.active && premiumModels.includes(selectedModel)) {
            vscode.window.showWarningMessage('Premium models are only available for subscribers. Using Gemini Pro instead.');
        }
        
        const model = userSubscription.active ? selectedModel : 'gemini-pro-2.5';
        
        // Prepare payload for n8n webhook
        const payload = {
            systemPrompt: { role: 'system', content: systemPrompt },
            userPrompt: { role: 'user', content: userPrompt },
            model: model,
            subscription: {
                active: userSubscription.active,
                plan: userSubscription.plan,
                requestsToday: userSubscription.requestsToday
            }
        };
        
        const response = await axios.post(
            webhookUrl,
            payload,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': apiKey ? \`Bearer \${apiKey}\` : undefined
                }
            }
        );
        
        // Increment request count for today
        const today = new Date().toISOString().split('T')[0];
        const session = await supabase.auth.getSession();
        if (session.data.session) {
            await supabase.rpc('increment_daily_requests', {
                user_id: session.data.session.user.id,
                request_date: today
            });
        }
        
        userSubscription.requestsToday++;
        updateStatusBar();
        
        return response.data.completion || response.data.explanation || response.data.fixed_code || '';
    } catch (error) {
        throw new Error(\`Failed to communicate with AI service: \${error.message}\`);
    }
}

// Helper function to register commands
function registerCommand(command: string, callback: () => Promise<void>): vscode.Disposable {
    return vscode.commands.registerCommand(\`extension.\${command}\`, callback);
}

let statusBarItem: vscode.StatusBarItem;

export function activate(context: vscode.ExtensionContext) {
    // Add status bar item
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);
    statusBarItem.command = 'extension.openSettings';
    statusBarItem.text = '$(sparkle) SupaCode';
    statusBarItem.tooltip = 'Configure SupaCode Assistant settings';
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);

    // Check subscription status on activation
    checkSubscription();

    // Update status bar when settings change
    vscode.workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration('supaCodeAssistant')) {
            updateStatusBar();
        }
    });

    // Register settings and auth commands
    const settingsCommand = vscode.commands.registerCommand('extension.openSettings', () => {
        vscode.commands.executeCommand('workbench.action.openSettings', '@ext:supacode-assistant');
    });
    context.subscriptions.push(settingsCommand);
    
    const loginCommand = vscode.commands.registerCommand('extension.login', async () => {
        // Open login page in browser
        vscode.env.openExternal(vscode.Uri.parse('https://your-supacode-website.com/login'));
    });
    context.subscriptions.push(loginCommand);
    
    const upgradeCommand = vscode.commands.registerCommand('extension.upgrade', async () => {
        // Open upgrade page in browser
        vscode.env.openExternal(vscode.Uri.parse('https://your-supacode-website.com/pricing'));
    });
    context.subscriptions.push(upgradeCommand);

    // Register main commands
    const commands = [
        registerCommand('supaComplete', generateCode),
        registerCommand('supaExplain', explainCode),
        registerCommand('supaRefactor', refactorCode),
        registerCommand('supaTest', generateTests),
        registerCommand('supaDoc', generateDocumentation),
        registerCommand('supaAsk', askAI),
        registerCommand('supaFix', fixBugs)
    ];

    context.subscriptions.push(...commands);

    // Register code lens provider for inline assistance
    const codeLensProvider = new SupaCodeLensProvider();
    context.subscriptions.push(
        vscode.languages.registerCodeLensProvider(
            ['javascript', 'typescript', 'javascriptreact', 'typescriptreact'],
            codeLensProvider
        )
    );

    // Register inline completion provider
    const completionProvider = new SupaCompletionProvider();
    context.subscriptions.push(
        vscode.languages.registerInlineCompletionItemProvider(
            ['javascript', 'typescript', 'javascriptreact', 'typescriptreact'],
            completionProvider
        )
    );
}`} />
            </TabsContent>
            <TabsContent value="commands">
              <CodeViewer language="typescript" code={`// Main command functions
async function generateCode() {
    if (!validateConfig()) return;

    const editor = vscode.window.activeTextEditor;
    if (!editor) return vscode.window.showInformationMessage('No active editor');

    const selection = editor.selection;
    const code = editor.document.getText(selection.isEmpty ? undefined : selection);
    const languageId = editor.document.languageId;
    const fileName = editor.document.fileName.split('/').pop() || '';

    try {
        const config = vscode.workspace.getConfiguration('supaCodeAssistant');
        const webhookUrl = config.get<string>('completionWebhook');
        
        // Allow user to enter a prompt
        const prompt = await vscode.window.showInputBox({ 
            prompt: 'Describe the code you want to generate',
            placeHolder: 'E.g., Create a React component that displays a list of items'
        });
        
        if (!prompt) return;

        const systemPrompt = \`You are an expert code generation assistant. Generate clean, efficient, professional \${languageId} code that follows best practices. The user is working in a file named \${fileName}.\`;

        const userPromptContent = selection.isEmpty
            ? prompt
            : \`Based on this context:\\n\\n\${code}\\n\\nGenerate code for: \${prompt}\`;

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Generating code...",
            cancellable: true
        }, async (progress, token) => {
            const completion = await callAI(webhookUrl, systemPrompt, userPromptContent);
            
            if (token.isCancellationRequested) return;
            
            // Extract code block if response contains markdown
            let codeToInsert = completion;
            const codeBlockMatch = completion.match(/\`\`\`(?:\\w+)?\\n([\\s\\S]+?)\\n\`\`\`/);
            if (codeBlockMatch && codeBlockMatch[1]) {
                codeToInsert = codeBlockMatch[1];
            }
            
            editor.edit(editBuilder => {
                if (selection.isEmpty) {
                    editBuilder.insert(selection.active, codeToInsert);
                } else {
                    editBuilder.replace(selection, codeToInsert);
                }
            });
        });
    } catch (error) {
        handleError(error, 'Failed to generate code');
    }
}

async function explainCode() {
    if (!validateConfig()) return;

    const editor = vscode.window.activeTextEditor;
    if (!editor) return vscode.window.showInformationMessage('No active editor');

    const selection = editor.selection;
    if (selection.isEmpty) {
        vscode.window.showInformationMessage('Please select code to explain');
        return;
    }
    
    const code = editor.document.getText(selection);
    const languageId = editor.document.languageId;

    try {
        const config = vscode.workspace.getConfiguration('supaCodeAssistant');
        const webhookUrl = config.get<string>('explainWebhook');
        
        const systemPrompt = \`You are a code explainer. Explain the following \${languageId} code in simple terms, focusing on its purpose, functionality, and best practices used.\`;

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Explaining code...",
            cancellable: true
        }, async (progress, token) => {
            const explanation = await callAI(webhookUrl, systemPrompt, code);
            
            if (token.isCancellationRequested) return;

            // Create a new output channel and show the explanation
            const channel = vscode.window.createOutputChannel('SupaCode Explanation');
            channel.appendLine(explanation);
            channel.show();
        });
    } catch (error) {
        handleError(error, 'Failed to explain code');
    }
}

async function refactorCode() {
    if (!validateConfig()) return;

    const editor = vscode.window.activeTextEditor;
    if (!editor) return vscode.window.showInformationMessage('No active editor');

    const selection = editor.selection;
    if (selection.isEmpty) {
        vscode.window.showInformationMessage('Please select code to refactor');
        return;
    }
    
    const code = editor.document.getText(selection);
    const languageId = editor.document.languageId;

    try {
        const config = vscode.workspace.getConfiguration('supaCodeAssistant');
        const webhookUrl = config.get<string>('refactorWebhook');
        
        // Get refactoring options
        const refactoringType = await vscode.window.showQuickPick([
            { label: 'General Improvements', description: 'General code quality improvements' },
            { label: 'Performance', description: 'Optimize for performance' },
            { label: 'Readability', description: 'Improve code readability' },
            { label: 'Modern Syntax', description: 'Update to modern language features' },
        ], { placeHolder: 'Select refactoring type' });
        
        if (!refactoringType) return;

        const systemPrompt = \`You are a code refactoring assistant. Improve the following \${languageId} code focusing on \${refactoringType.label}. 
        Only provide the refactored code, no explanations. Ensure the refactored code maintains the exact same functionality.\`;

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Refactoring code...",
            cancellable: true
        }, async (progress, token) => {
            const refactored = await callAI(webhookUrl, systemPrompt, code);
            
            if (token.isCancellationRequested) return;
            
            // Extract code block if response contains markdown
            let codeToInsert = refactored;
            const codeBlockMatch = refactored.match(/\`\`\`(?:\\w+)?\\n([\\s\\S]+?)\\n\`\`\`/);
            if (codeBlockMatch && codeBlockMatch[1]) {
                codeToInsert = codeBlockMatch[1];
            }
            
            editor.edit(editBuilder => {
                editBuilder.replace(selection, codeToInsert);
            });
        });
    } catch (error) {
        handleError(error, 'Failed to refactor code');
    }
}

async function generateTests() {
    if (!validateConfig()) return;

    const editor = vscode.window.activeTextEditor;
    if (!editor) return vscode.window.showInformationMessage('No active editor');

    const selection = editor.selection;
    const code = editor.document.getText(selection.isEmpty ? undefined : selection);
    const languageId = editor.document.languageId;

    try {
        const config = vscode.workspace.getConfiguration('supaCodeAssistant');
        const webhookUrl = config.get<string>('testWebhook');
        
        // Get testing framework preference
        const testingFramework = await vscode.window.showQuickPick([
            { label: 'Jest', description: 'Facebook\\'s JavaScript testing framework' },
            { label: 'Mocha', description: 'Feature-rich JavaScript test framework' },
            { label: 'Vitest', description: 'Vite-native testing framework' },
        ], { placeHolder: 'Select testing framework' });
        
        if (!testingFramework) return;

        const systemPrompt = \`You are a test generation assistant. Generate comprehensive unit tests for the following \${languageId} code using the \${testingFramework.label} framework. The tests should cover all edge cases and follow best testing practices.\`;

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Generating tests...",
            cancellable: true
        }, async (progress, token) => {
            const tests = await callAI(webhookUrl, systemPrompt, code);
            
            if (token.isCancellationRequested) return;
            
            // Create a new untitled document for the tests
            const document = await vscode.workspace.openTextDocument({
                language: languageId,
                content: tests
            });
            await vscode.window.showTextDocument(document);
        });
    } catch (error) {
        handleError(error, 'Failed to generate tests');
    }
}`} />
            </TabsContent>
            <TabsContent value="package">
              <CodeViewer language="json" code={`{
  "name": "supacode-assistant",
  "displayName": "SupaCode AI Assistant",
  "description": "AI code assistant powered by n8n webhooks and Supabase",
  "version": "0.1.0",
  "engines": {
    "vscode": "^1.80.0"
  },
  "categories": [
    "Programming Languages",
    "Other"
  ],
  "activationEvents": [
    "onStartupFinished"
  ],
  "main": "./dist/extension.js",
  "contributes": {
    "commands": [
      {
        "command": "extension.supaComplete",
        "title": "SupaCode: Generate Code"
      },
      {
        "command": "extension.supaExplain",
        "title": "SupaCode: Explain Code"
      },
      {
        "command": "extension.supaRefactor",
        "title": "SupaCode: Refactor Code"
      },
      {
        "command": "extension.supaTest",
        "title": "SupaCode: Generate Tests"
      },
      {
        "command": "extension.supaDoc",
        "title": "SupaCode: Generate Documentation"
      },
      {
        "command": "extension.supaAsk",
        "title": "SupaCode: Ask AI"
      },
      {
        "command": "extension.supaFix",
        "title": "SupaCode: Fix Bugs"
      },
      {
        "command": "extension.openSettings",
        "title": "SupaCode: Open Settings"
      },
      {
        "command": "extension.login",
        "title": "SupaCode: Log In"
      },
      {
        "command": "extension.upgrade",
        "title": "SupaCode: Upgrade to Premium"
      }
    ],
    "configuration": {
      "title": "SupaCode Assistant",
      "properties": {
        "supaCodeAssistant.completionWebhook": {
          "type": "string",
          "default": "",
          "description": "n8n webhook URL for code completion"
        },
        "supaCodeAssistant.fixWebhook": {
          "type": "string",
          "default": "",
          "description": "n8n webhook URL for code fixes"
        },
        "supaCodeAssistant.explainWebhook": {
          "type": "string",
          "default": "",
          "description": "n8n webhook URL for code explanation"
        },
        "supaCodeAssistant.refactorWebhook": {
          "type": "string",
          "default": "",
          "description": "n8n webhook URL for code refactoring"
        },
        "supaCodeAssistant.testWebhook": {
          "type": "string",
          "default": "",
          "description": "n8n webhook URL for test generation"
        },
        "supaCodeAssistant.docWebhook": {
          "type": "string",
          "default": "",
          "description": "n8n webhook URL for documentation generation"
        },
        "supaCodeAssistant.askWebhook": {
          "type": "string",
          "default": "",
          "description": "n8n webhook URL for general AI questions"
        },
        "supaCodeAssistant.model": {
          "type": "string",
          "default": "gpt-4o",
          "enum": [
            "gpt-4o",
            "gpt-4o-mini",
            "gpt-4-turbo",
            "gpt-3.5-turbo",
            "gemini-pro-2.5"
          ],
          "description": "AI model to use for code generation (premium only)"
        },
        "supaCodeAssistant.apiKey": {
          "type": "string",
          "default": "",
          "description": "API key for authentication"
        },
        "supaCodeAssistant.inlineCompletions": {
          "type": "boolean",
          "default": true,
          "description": "Enable AI-powered inline code completions"
        }
      }
    },
    "keybindings": [
      {
        "command": "extension.supaComplete",
        "key": "ctrl+shift+g",
        "mac": "cmd+shift+g",
        "when": "editorTextFocus"
      },
      {
        "command": "extension.supaAsk",
        "key": "ctrl+shift+a",
        "mac": "cmd+shift+a"
      }
    ],
    "menus": {
      "editor/context": [
        {
          "submenu": "supacode.menu",
          "group": "navigation"
        }
      ],
      "supacode.menu": [
        {
          "command": "extension.supaComplete",
          "group": "1_generation"
        },
        {
          "command": "extension.supaExplain",
          "group": "1_generation"
        },
        {
          "command": "extension.supaRefactor",
          "group": "2_modification"
        },
        {
          "command": "extension.supaFix",
          "group": "2_modification"
        },
        {
          "command": "extension.supaTest",
          "group": "3_analysis"
        },
        {
          "command": "extension.supaDoc",
          "group": "3_analysis"
        },
        {
          "command": "extension.supaAsk",
          "group": "4_misc"
        },
        {
          "command": "extension.login",
          "group": "5_account"
        },
        {
          "command": "extension.upgrade",
          "group": "5_account"
        }
      ]
    },
    "submenus": [
      {
        "id": "supacode.menu",
        "label": "SupaCode AI"
      }
    ]
  },
  "dependencies": {
    "axios": "^1.4.0",
    "@supabase/supabase-js": "^2.39.3"
  },
  "devDependencies": {
    "@types/vscode": "^1.80.0",
    "@types/node": "^20.4.5",
    "@typescript-eslint/eslint-plugin": "^5.62.0",
    "@typescript-eslint/parser": "^5.62.0",
    "eslint": "^8.45.0",
    "typescript": "^5.1.6",
    "webpack": "^5.88.2",
    "webpack-cli": "^5.1.4",
    "ts-loader": "^9.4.4"
  }
}`} />
            </TabsContent>
            <TabsContent value="subscription">
              <CodeViewer language="typescript" code={`// SQL Schema for Supabase
/*
-- Create subscription and user related tables

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

-- Function to reset daily request counts
-- Create a cron job to run this daily
CREATE OR REPLACE FUNCTION reset_daily_requests()
RETURNS VOID AS $$
BEGIN
    UPDATE public.user_subscriptions
    SET requests_log = '{}',
        updated_at = now();
END;
$$ LANGUAGE plpgsql;
*/

// Supabase Edge Function for Stripe Webhook handler
/*
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"
import Stripe from "https://esm.sh/stripe@14.21.0"

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
})

const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

const supabase = createClient(supabaseUrl, supabaseServiceKey)

serve(async (req) => {
  const signature = req.headers.get('stripe-signature')
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
  
  if (!signature || !webhookSecret) {
    return new Response('Webhook signature missing', { status: 400 })
  }

  const body = await req.text()
  let event
  
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error(\`Webhook Error: \${err.message}\`)
    return new Response(\`Webhook Error: \${err.message}\`, { status: 400 })
  }

  try {
    // Handle the event
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        const subscription = event.data.object
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('stripe_customer_id', subscription.customer)
          .single()
        
        if (userError) throw userError
        
        await supabase
          .from('user_subscriptions')
          .upsert({
            user_id: userData.id,
            stripe_subscription_id: subscription.id,
            stripe_customer_id: subscription.customer,
            active: subscription.status === 'active',
            plan: subscription.items.data[0]?.plan.nickname || 'premium',
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id'
          })
        break
        
      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object
        await supabase
          .from('user_subscriptions')
          .update({
            active: false,
            updated_at: new Date().toISOString()
          })
          .eq('stripe_subscription_id', deletedSubscription.id)
        break
        
      case 'invoice.payment_succeeded':
        const invoice = event.data.object
        if (invoice.subscription) {
          const { data: subData } = await supabase
            .from('user_subscriptions')
            .select('id, user_id')
            .eq('stripe_subscription_id', invoice.subscription)
            .single()
            
          if (subData) {
            await supabase
              .from('payment_history')
              .insert({
                user_id: subData.user_id,
                stripe_invoice_id: invoice.id,
                amount: invoice.amount_paid / 100,
                currency: invoice.currency,
                status: 'paid',
                payment_date: new Date(invoice.created * 1000).toISOString(),
                subscription_id: subData.id
              })
          }
        }
        break
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return new Response(JSON.stringify({ error: 'Webhook handler failed' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
*/`} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExtensionSetup;
