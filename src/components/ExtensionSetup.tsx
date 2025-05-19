
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
            VS Code extension code that uses a Supabase Edge Function
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="main">
            <TabsList className="mb-4">
              <TabsTrigger value="main">Main</TabsTrigger>
              <TabsTrigger value="commands">Commands</TabsTrigger>
              <TabsTrigger value="package">package.json</TabsTrigger>
            </TabsList>
            <TabsContent value="main">
              <CodeViewer language="typescript" code={`import * as vscode from 'vscode';
import axios from 'axios';

// Helper function to validate configuration
function validateConfig(): boolean {
    const config = vscode.workspace.getConfiguration('supaCodeAssistant');
    const edgeFunctionUrl = config.get<string>('edgeFunctionUrl');

    if (!edgeFunctionUrl) {
        vscode.window.showErrorMessage('Please configure your Supabase Edge Function URL in settings');
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

// Helper function to call AI via Supabase Edge Function
async function callAI(systemPrompt: string, userPrompt: string): Promise<string> {
    try {
        const config = vscode.workspace.getConfiguration('supaCodeAssistant');
        const edgeFunctionUrl = config.get<string>('edgeFunctionUrl');
        const model = config.get<string>('model') || 'gpt-4o';
        const apiKey = config.get<string>('apiKey') || '';

        const response = await axios.post(
            edgeFunctionUrl!, 
            {
                systemPrompt: { role: 'system', content: systemPrompt },
                userPrompt: { role: 'user', content: userPrompt },
                model
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': apiKey ? \`Bearer \${apiKey}\` : undefined
                }
            }
        );

        return response.data.content || '';
    } catch (error) {
        throw new Error(\`Failed to communicate with Edge Function: \${error.message}\`);
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

    // Update status bar when settings change
    vscode.workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration('supaCodeAssistant')) {
            updateStatusBar();
        }
    });

    // Initial status bar update
    try {
        updateStatusBar();
    } catch (error) {
        console.error('Failed to update status bar:', error);
    }

    // Register settings command
    const settingsCommand = vscode.commands.registerCommand('extension.openSettings', () => {
        vscode.commands.executeCommand('workbench.action.openSettings', '@ext:supacode-assistant');
    });
    context.subscriptions.push(settingsCommand);

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
    // This is a more advanced feature similar to Copilot
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
}

function updateStatusBar() {
    try {
        const config = vscode.workspace.getConfiguration('supaCodeAssistant');
        const model = config.get<string>('model') || 'gpt-4o';
        statusBarItem.text = \`$(sparkle) SupaCode [\${model}]\`;
    } catch (error) {
        console.error('Failed to update status bar text:', error);
        statusBarItem.text = '$(sparkle) SupaCode';
    }
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
        // Allow user to enter a prompt
        const prompt = await vscode.window.showInputBox({ 
            prompt: 'Describe the code you want to generate',
            placeHolder: 'E.g., Create a React component that displays a list of items'
        });
        
        if (!prompt) return;

        const systemPrompt = \`You are an expert code generation assistant. Generate clean, efficient, professional \${languageId} code that follows best practices. The user is working in a file named \${fileName}.\`;

        const userPromptContent = selection.isEmpty
            ? prompt
            : \`Based on this context:\n\n\${code}\n\nGenerate code for: \${prompt}\`;

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Generating code...",
            cancellable: true
        }, async (progress, token) => {
            const completion = await callAI(systemPrompt, userPromptContent);
            
            // Extract code block if response contains markdown
            let codeToInsert = completion;
            const codeBlockMatch = completion.match(/\`\`\`(?:\w+)?\n([\s\S]+?)\n\`\`\`/);
            if (codeBlockMatch && codeBlockMatch[1]) {
                codeToInsert = codeBlockMatch[1];
            }

            if (token.isCancellationRequested) return;
            
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
        const systemPrompt = \`You are a code explainer. Explain the following \${languageId} code in simple terms, focusing on its purpose, functionality, and best practices used.\`;

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Explaining code...",
            cancellable: true
        }, async (progress, token) => {
            const explanation = await callAI(systemPrompt, code);
            
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
        // Get refactoring options
        const refactoringType = await vscode.window.showQuickPick([
            { label: 'General Improvements', description: 'General code quality improvements' },
            { label: 'Performance', description: 'Optimize for performance' },
            { label: 'Readability', description: 'Improve code readability' },
            { label: 'Modern Syntax', description: 'Update to modern language features' },
        ], { placeHolder: 'Select refactoring type' });
        
        if (!refactoringType) return;

        const systemPrompt = \`You are a code refactoring assistant. Improve the following \${languageId} code focusing on ${refactoringType.label}. 
        Only provide the refactored code, no explanations. Ensure the refactored code maintains the exact same functionality.\`;

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Refactoring code...",
            cancellable: true
        }, async (progress, token) => {
            const refactored = await callAI(systemPrompt, code);
            
            if (token.isCancellationRequested) return;
            
            // Extract code block if response contains markdown
            let codeToInsert = refactored;
            const codeBlockMatch = refactored.match(/\`\`\`(?:\w+)?\n([\s\S]+?)\n\`\`\`/);
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
        // Get testing framework preference
        const testingFramework = await vscode.window.showQuickPick([
            { label: 'Jest', description: 'Facebook\'s JavaScript testing framework' },
            { label: 'Mocha', description: 'Feature-rich JavaScript test framework' },
            { label: 'Vitest', description: 'Vite-native testing framework' },
        ], { placeHolder: 'Select testing framework' });
        
        if (!testingFramework) return;

        const systemPrompt = \`You are a test generation assistant. Generate comprehensive unit tests for the following \${languageId} code using the ${testingFramework.label} framework. The tests should cover all edge cases and follow best testing practices.\`;

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Generating tests...",
            cancellable: true
        }, async (progress, token) => {
            const tests = await callAI(systemPrompt, code);
            
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
}

async function generateDocumentation() {
    if (!validateConfig()) return;

    const editor = vscode.window.activeTextEditor;
    if (!editor) return vscode.window.showInformationMessage('No active editor');

    const selection = editor.selection;
    if (selection.isEmpty) {
        vscode.window.showInformationMessage('Please select code to document');
        return;
    }
    
    const code = editor.document.getText(selection);
    const languageId = editor.document.languageId;

    try {
        const systemPrompt = \`You are a documentation assistant. Generate clear, concise, and comprehensive documentation for the following \${languageId} code, following best practices for the language. Use JSDoc style if appropriate for the language.\`;

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Generating documentation...",
            cancellable: true
        }, async (progress, token) => {
            const docs = await callAI(systemPrompt, code);
            
            if (token.isCancellationRequested) return;
            
            // Extract just the documentation part if it's a markdown response
            let docsToInsert = docs;
            const jsDocMatch = docs.match(/\`\`\`(?:\w+)?\n([\s\S]+?)\n\`\`\`/);
            if (jsDocMatch && jsDocMatch[1]) {
                docsToInsert = jsDocMatch[1];
            }
            
            // Insert at the beginning of the selection
            const position = new vscode.Position(selection.start.line, selection.start.character);
            editor.edit(editBuilder => {
                editBuilder.insert(position, docsToInsert + (docsToInsert.endsWith('\n') ? '' : '\n'));
            });
        });
    } catch (error) {
        handleError(error, 'Failed to generate documentation');
    }
}

async function askAI() {
    if (!validateConfig()) return;

    try {
        // Get the user's question
        const question = await vscode.window.showInputBox({ 
            prompt: 'What would you like to ask?',
            placeHolder: 'E.g., How do I implement a React context?'
        });
        
        if (!question) return;
        
        const editor = vscode.window.activeTextEditor;
        let context = '';
        
        if (editor) {
            const selection = editor.selection;
            if (!selection.isEmpty) {
                context = editor.document.getText(selection);
            }
        }
        
        const systemPrompt = \`You are a helpful coding assistant that provides clear, concise answers to programming questions.\`;
        const userPromptContent = context 
            ? \`Context:\n\n\${context}\n\nQuestion: \${question}\`
            : question;

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Thinking...",
            cancellable: true
        }, async (progress, token) => {
            const answer = await callAI(systemPrompt, userPromptContent);
            
            if (token.isCancellationRequested) return;

            // Create a markdown preview for better formatting
            const panel = vscode.window.createWebviewPanel(
                'supaCodeAnswer',
                'SupaCode Answer',
                vscode.ViewColumn.Beside,
                {
                    enableScripts: true
                }
            );
            
            panel.webview.html = \`
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                        body { font-family: Arial, sans-serif; padding: 20px; }
                        pre { background-color: #f5f5f5; padding: 10px; border-radius: 4px; overflow-x: auto; }
                        code { font-family: 'Courier New', monospace; }
                    </style>
                </head>
                <body>
                    <h2>Your Question</h2>
                    <p>\${question}</p>
                    <h2>Answer</h2>
                    <div id="answer">\${answer.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\\n/g, '<br>').replace(/\`\`\`(.*?)\\n([\\s\\S]*?)\\n\`\`\`/g, '<pre><code>$2</code></pre>')}</div>
                </body>
                </html>
            \`;
        });
    } catch (error) {
        handleError(error, 'Failed to get answer');
    }
}

async function fixBugs() {
    if (!validateConfig()) return;

    const editor = vscode.window.activeTextEditor;
    if (!editor) return vscode.window.showInformationMessage('No active editor');

    const selection = editor.selection;
    if (selection.isEmpty) {
        vscode.window.showInformationMessage('Please select code to fix');
        return;
    }
    
    const code = editor.document.getText(selection);
    const languageId = editor.document.languageId;

    try {
        // Get error description
        const errorDescription = await vscode.window.showInputBox({ 
            prompt: 'Describe the error or bug you\'re experiencing (optional)',
            placeHolder: 'E.g., TypeError: Cannot read property of undefined'
        });
        
        const systemPrompt = \`You are a bug fixing assistant. Fix bugs in the following \${languageId} code. Only return the fixed code, no explanations.\`;
        const userPromptContent = errorDescription 
            ? \`Code with bug:\n\n\${code}\n\nError: \${errorDescription}\`
            : \`Code with bug:\n\n\${code}\`;

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Fixing bugs...",
            cancellable: true
        }, async (progress, token) => {
            const fixedCode = await callAI(systemPrompt, userPromptContent);
            
            if (token.isCancellationRequested) return;
            
            // Extract code block if response contains markdown
            let codeToInsert = fixedCode;
            const codeBlockMatch = fixedCode.match(/\`\`\`(?:\w+)?\n([\s\S]+?)\n\`\`\`/);
            if (codeBlockMatch && codeBlockMatch[1]) {
                codeToInsert = codeBlockMatch[1];
            }
            
            editor.edit(editBuilder => {
                editBuilder.replace(selection, codeToInsert);
            });
        });
    } catch (error) {
        handleError(error, 'Failed to fix bugs');
    }
}

// Code Lens for inline assistance
class SupaCodeLensProvider implements vscode.CodeLensProvider {
    async provideCodeLenses(
        document: vscode.TextDocument, 
        token: vscode.CancellationToken
    ): Promise<vscode.CodeLens[]> {
        const codeLenses: vscode.CodeLens[] = [];
        
        // Add CodeLens at function declarations and class declarations
        const text = document.getText();
        const functionRegex = /(?:function\\s+(\\w+)|(?:const|let|var)\\s+(\\w+)\\s*=\\s*(?:async\\s*)?\\(.*?\\)\\s*=>|(?:const|let|var)\\s+(\\w+)\\s*=\\s*(?:async\\s*)?function|class\\s+(\\w+))/g;
        
        let match;
        while ((match = functionRegex.exec(text)) !== null) {
            if (token.isCancellationRequested) return [];
            
            const name = match[1] || match[2] || match[3] || match[4];
            if (!name) continue;
            
            const position = document.positionAt(match.index);
            const range = new vscode.Range(position, position);
            
            codeLenses.push(
                new vscode.CodeLens(range, {
                    title: "✨ Document",
                    command: "extension.supaDoc",
                    tooltip: "Generate documentation for this code"
                })
            );
            
            codeLenses.push(
                new vscode.CodeLens(range, {
                    title: "🔍 Test",
                    command: "extension.supaTest",
                    tooltip: "Generate tests for this code"
                })
            );
        }
        
        return codeLenses;
    }
}

// Inline completion provider
class SupaCompletionProvider implements vscode.InlineCompletionItemProvider {
    // Throttle inline completion requests to avoid excessive API calls
    private lastRequestTime = 0;
    private readonly THROTTLE_INTERVAL = 3000; // 3 seconds
    
    async provideInlineCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        context: vscode.InlineCompletionContext,
        token: vscode.CancellationToken
    ): Promise<vscode.InlineCompletionItem[] | undefined> {
        // Check if we should skip this request due to throttling
        const now = Date.now();
        if (now - this.lastRequestTime < this.THROTTLE_INTERVAL) {
            return undefined;
        }
        
        // Check if configuration is valid
        if (!validateConfig()) return undefined;
        
        try {
            // Get context around the cursor
            const linePrefix = document.lineAt(position.line).text.substring(0, position.character);
            if (linePrefix.trim().length < 3) return undefined; // Don't suggest if line is almost empty
            
            // Get surrounding context
            const startLine = Math.max(0, position.line - 10);
            const contextRange = new vscode.Range(startLine, 0, position.line, position.character);
            const contextText = document.getText(contextRange);
            
            // Update last request time
            this.lastRequestTime = now;
            
            const systemPrompt = \`You are a code completion assistant. Predict the next part of the code based on the context. Only respond with the code that should come next, nothing else. Keep it concise.\`;
            
            const completion = await callAI(systemPrompt, contextText);
            
            // Clean up the completion
            // Remove any markdown formatting or explanations
            let cleanCompletion = completion.replace(/\`\`\`(?:\w+)?(.*?)\`\`\`/gs, '$1').trim();
            
            // If completion is too long or seems to be an explanation rather than code, skip it
            if (cleanCompletion.split('\\n').length > 15 || 
                cleanCompletion.startsWith('Here') || 
                cleanCompletion.includes('example')) {
                return undefined;
            }
            
            return [
                new vscode.InlineCompletionItem(
                    cleanCompletion, 
                    new vscode.Range(position, position)
                )
            ];
        } catch (error) {
            console.error('Inline completion error:', error);
            return undefined;
        }
    }
}

export function deactivate() {}`} />
            </TabsContent>
            <TabsContent value="package">
              <CodeViewer language="json" code={`{
  "name": "supacode-assistant",
  "displayName": "SupaCode AI Assistant",
  "description": "AI code assistant powered by Supabase Edge Functions",
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
      }
    ],
    "configuration": {
      "title": "SupaCode Assistant",
      "properties": {
        "supaCodeAssistant.edgeFunctionUrl": {
          "type": "string",
          "default": "",
          "description": "URL of your Supabase Edge Function for AI requests"
        },
        "supaCodeAssistant.model": {
          "type": "string",
          "default": "gpt-4o",
          "enum": [
            "gpt-4o",
            "gpt-4o-mini",
            "gpt-4-turbo",
            "gpt-3.5-turbo"
          ],
          "description": "AI model to use for code generation"
        },
        "supaCodeAssistant.apiKey": {
          "type": "string",
          "default": "",
          "description": "Optional API key for authentication with your Edge Function"
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
    "axios": "^1.4.0"
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
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExtensionSetup;
