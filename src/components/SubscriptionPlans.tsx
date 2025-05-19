
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckIcon } from "lucide-react";

interface SubscriptionPlan {
  name: string;
  description: string;
  price: string;
  period: string;
  features: string[];
  buttonLabel: string;
  priceId: string;
  highlight?: boolean;
}

interface SubscriptionPlansProps {
  onSelectPlan: (priceId: string) => void;
}

const plans: SubscriptionPlan[] = [
  {
    name: "Free",
    description: "Great for getting started",
    price: "$0",
    period: "forever",
    features: [
      "Access to Gemini Pro 2.5 model",
      "Limited to 100 requests per day",
      "Basic code completion",
      "Basic code explanations"
    ],
    buttonLabel: "Current Plan",
    priceId: "free"
  },
  {
    name: "Monthly",
    description: "Best for regular users",
    price: "$9.99",
    period: "per month",
    features: [
      "Access to GPT-4o model",
      "Unlimited requests",
      "Advanced code completion",
      "Advanced code refactoring",
      "Complete test generation",
      "Priority support"
    ],
    buttonLabel: "Subscribe Monthly",
    priceId: "price_monthly123",
    highlight: true
  },
  {
    name: "Yearly",
    description: "Best value",
    price: "$99.99",
    period: "per year",
    features: [
      "Everything in Monthly plan",
      "Save 16% compared to monthly",
      "Early access to new features",
      "Team collaboration features"
    ],
    buttonLabel: "Subscribe Yearly",
    priceId: "price_yearly456"
  }
];

const SubscriptionPlans: React.FC<SubscriptionPlansProps> = ({ onSelectPlan }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {plans.map((plan) => (
        <Card 
          key={plan.name} 
          className={`flex flex-col ${plan.highlight 
            ? 'border-primary shadow-lg' 
            : 'border-gray-200'}`}
        >
          <CardHeader>
            <CardTitle>{plan.name}</CardTitle>
            <CardDescription>{plan.description}</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <div className="text-3xl font-bold flex items-end gap-2">
              {plan.price}
              <span className="text-sm font-normal text-muted-foreground">
                {plan.period}
              </span>
            </div>
            
            <ul className="mt-4 space-y-2">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2">
                  <CheckIcon className="h-4 w-4 text-primary" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full" 
              variant={plan.name === "Free" ? "outline" : "default"}
              onClick={() => onSelectPlan(plan.priceId)}
              disabled={plan.name === "Free"}
            >
              {plan.buttonLabel}
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

export default SubscriptionPlans;
