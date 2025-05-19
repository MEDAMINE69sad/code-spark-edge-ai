
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { CodeViewer } from './CodeViewer';

interface VSCodeExtensionDemoProps {
  edgeFunctionUrl: string;
}

const VSCodeExtensionDemo: React.FC<VSCodeExtensionDemoProps> = ({ edgeFunctionUrl }) => {
  const [inputCode, setInputCode] = useState(`function calculateTotal(items) {\n  let sum = 0;\n  for (let i = 0; i < items.length; i++) {\n    sum += items[i].price;\n  }\n  return sum;\n}`);
  const [outputCode, setOutputCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeFeature, setActiveFeature] = useState('refactor');

  const handleFeatureClick = async (feature: string) => {
    if (!edgeFunctionUrl) {
      setOutputCode("Please set up your Edge Function URL in the 'Edge Function' tab.");
      return;
    }

    setIsLoading(true);
    setActiveFeature(feature);

    try {
      // In a real extension, this would call your Supabase Edge Function
      // For demo purposes, we'll simulate responses
      
      setTimeout(() => {
        setIsLoading(false);
        
        switch (feature) {
          case 'complete':
            setOutputCode(`${inputCode}\n\n// Example usage:\nconst items = [\n  { name: 'Product 1', price: 10 },\n  { name: 'Product 2', price: 20 },\n  { name: 'Product 3', price: 30 }\n];\n\nconst total = calculateTotal(items);\nconsole.log(\`Total price: \${total}\`);`);
            break;
          case 'explain':
            setOutputCode(`This function calculates the total price of a collection of items.\n\n1. It declares a variable 'sum' initialized to 0\n2. It iterates through each item in the 'items' array\n3. For each item, it adds the item's price to the running sum\n4. Finally, it returns the total sum\n\nPerformance considerations:\n- Time complexity: O(n) where n is the number of items\n- Space complexity: O(1) as it uses constant extra space`);
            break;
          case 'refactor':
            setOutputCode(`// Refactored using modern JavaScript features\nfunction calculateTotal(items) {\n  // Use reduce for cleaner array processing\n  return items.reduce((sum, item) => sum + item.price, 0);\n}\n\n// Could also be written as an arrow function:\n// const calculateTotal = (items) => items.reduce((sum, item) => sum + item.price, 0);`);
            break;
          case 'test':
            setOutputCode(`import { describe, it, expect } from 'vitest';\n\ndescribe('calculateTotal', () => {\n  it('calculates the sum of item prices', () => {\n    const items = [\n      { name: 'Product 1', price: 10 },\n      { name: 'Product 2', price: 20 },\n      { name: 'Product 3', price: 30 }\n    ];\n    expect(calculateTotal(items)).toBe(60);\n  });\n\n  it('returns 0 for an empty array', () => {\n    expect(calculateTotal([])).toBe(0);\n  });\n\n  it('handles negative prices correctly', () => {\n    const items = [\n      { name: 'Product 1', price: 10 },\n      { name: 'Discount', price: -5 }\n    ];\n    expect(calculateTotal(items)).toBe(5);\n  });\n});`);
            break;
          case 'document':
            setOutputCode(`/**\n * Calculates the total price of all items in an array\n *\n * @param {Array<{price: number}>} items - An array of items with price properties\n * @returns {number} The sum of all item prices\n *\n * @example\n * const items = [{name: 'Product 1', price: 10}, {name: 'Product 2', price: 20}];\n * const total = calculateTotal(items);\n * // total === 30\n */`);
            break;
        }
      }, 1000);
    } catch (error) {
      setIsLoading(false);
      setOutputCode(`Error: Failed to process request. ${error}`);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Interactive Demo</CardTitle>
        <CardDescription>
          See how the VS Code extension would work with your Supabase Edge Function
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium mb-2">Input Code</h3>
            <Textarea 
              className="font-mono h-72" 
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
            />
          </div>
          <div>
            <h3 className="text-sm font-medium mb-2">AI Response</h3>
            <div className="bg-slate-50 p-4 rounded-md h-72 overflow-auto">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <pre className="text-xs whitespace-pre-wrap">{outputCode}</pre>
              )}
            </div>
          </div>
        </div>
      </CardContent>
      <Separator />
      <CardFooter className="flex flex-wrap gap-2 justify-center pt-6">
        <Button 
          variant={activeFeature === 'complete' ? 'default' : 'outline'} 
          onClick={() => handleFeatureClick('complete')}
          disabled={isLoading}
        >
          Complete
        </Button>
        <Button 
          variant={activeFeature === 'explain' ? 'default' : 'outline'} 
          onClick={() => handleFeatureClick('explain')}
          disabled={isLoading}
        >
          Explain
        </Button>
        <Button 
          variant={activeFeature === 'refactor' ? 'default' : 'outline'} 
          onClick={() => handleFeatureClick('refactor')}
          disabled={isLoading}
        >
          Refactor
        </Button>
        <Button 
          variant={activeFeature === 'test' ? 'default' : 'outline'} 
          onClick={() => handleFeatureClick('test')}
          disabled={isLoading}
        >
          Test
        </Button>
        <Button 
          variant={activeFeature === 'document' ? 'default' : 'outline'} 
          onClick={() => handleFeatureClick('document')}
          disabled={isLoading}
        >
          Document
        </Button>
      </CardFooter>
    </Card>
  );
};

export default VSCodeExtensionDemo;
