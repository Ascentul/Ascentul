import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

interface StatCardProps {
  icon: React.ReactNode;
  iconBgColor: string;
  iconColor: string;
  label: string;
  value: number | string;
  change?: {
    type: 'increase' | 'decrease' | 'no-change';
    text: string;
  };
}

export default function StatCard({ 
  icon, 
  iconBgColor, 
  iconColor, 
  label, 
  value, 
  change 
}: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center">
          <div className={cn("flex-shrink-0 p-3 rounded-full", iconBgColor)}>
            {icon}
          </div>
          <div className="ml-4">
            <h3 className="text-neutral-500 text-sm">{label}</h3>
            <p className="text-2xl font-semibold">{value}</p>
          </div>
        </div>

      </CardContent>
    </Card>
  );
}
