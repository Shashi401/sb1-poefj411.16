"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Loader2 } from "lucide-react";

export default function SubscriptionPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubscribe = async () => {
    setIsLoading(true);
    try {
      // TODO: Implement actual payment processing
      await new Promise(resolve => setTimeout(resolve, 1500));
      router.push("/dashboard");
    } catch (error) {
      console.error("Subscription error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">Upgrade to Pro</CardTitle>
          <CardDescription className="text-xl mt-2">
            Get access to all PPC optimization features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-center">
            <div className="text-center">
              <div className="text-4xl font-bold">
                $1<span className="text-lg font-normal text-muted-foreground">/month</span>
              </div>
              <p className="text-muted-foreground mt-2">Billed monthly</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-primary" />
              <span>Advanced PPC bid optimization</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-primary" />
              <span>Unlimited campaign analysis</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-primary" />
              <span>Performance tracking</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-primary" />
              <span>Priority support</span>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            className="w-full text-lg py-6"
            onClick={handleSubscribe}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Processing...
              </>
            ) : (
              "Subscribe Now"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}