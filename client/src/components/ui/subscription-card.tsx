import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface SubscriptionFeature {
  text: string;
  included: boolean;
}

interface SubscriptionCardProps {
  title: string;
  price: string;
  description: string;
  features: SubscriptionFeature[];
  onSubscribe: () => void;
  isPopular?: boolean;
  className?: string;
}

export default function SubscriptionCard({
  title,
  price,
  description,
  features,
  onSubscribe,
  isPopular = false,
  className,
}: SubscriptionCardProps) {
  return (
    <Card className={cn(
      "w-full", 
      isPopular && "border-primary shadow-lg shadow-primary/10", 
      className
    )}>
      {isPopular && (
        <div className="bg-primary text-white text-xs font-semibold px-3 py-1 rounded-t-md text-center">
          MOST POPULAR
        </div>
      )}
      
      <CardHeader>
        <CardTitle className="text-xl">{title}</CardTitle>
        <div className="mt-2">
          <span className="text-3xl font-bold">{price}</span>
          <span className="text-muted-foreground ml-1">/month</span>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      
      <CardContent>
        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <CheckCircle 
                className={cn(
                  "h-5 w-5 mr-2 flex-shrink-0", 
                  feature.included ? "text-primary" : "text-muted-foreground opacity-50"
                )} 
              />
              <span className={cn(
                "text-sm", 
                !feature.included && "text-muted-foreground line-through opacity-70"
              )}>
                {feature.text}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
      
      <CardFooter>
        <Button 
          onClick={onSubscribe} 
          className={cn(
            "w-full", 
            isPopular ? "bg-primary hover:bg-primary/90" : "bg-gray-200 text-gray-900 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
          )}
        >
          Subscribe Now
        </Button>
      </CardFooter>
    </Card>
  );
}
