
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";

const SubscriptionCancel: React.FC = () => {
  return (
    <div className="container mx-auto py-20 max-w-md">
      <Card>
        <CardHeader className="text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-2" />
          <CardTitle>Subscription Canceled</CardTitle>
          <CardDescription>
            You have canceled the subscription process
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p>
            No payment has been processed.
            You can still use the free features of SupaCode AI.
          </p>
          
          <div className="pt-4 space-x-4">
            <Button variant="outline" onClick={() => window.location.href = '/subscription'}>
              View Plans
            </Button>
            <Button onClick={() => window.location.href = '/'}>
              Back to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionCancel;
