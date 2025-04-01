import { CreditCard, Users, Headphones, Play } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface StatsCard {
  title: string;
  value: string;
  change?: string;
  changePositive?: boolean;
  icon: React.ReactNode;
  iconBgClass: string;
  iconColorClass: string;
}

interface UserStatsProps {
  stats: StatsCard[];
  className?: string;
}

export default function UserStats({ stats, className }: UserStatsProps) {
  return (
    <div className={`grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 ${className}`}>
      {stats.map((stat, index) => (
        <Card key={index} className="overflow-hidden shadow">
          <CardContent className="p-5">
            <div className="flex items-center">
              <div className={`flex-shrink-0 rounded-md ${stat.iconBgClass} p-3`}>
                <div className={stat.iconColorClass}>{stat.icon}</div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">{stat.title}</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900 dark:text-white">{stat.value}</div>
                    {stat.change && (
                      <div className={`ml-2 flex items-baseline text-sm font-semibold ${stat.changePositive ? 'text-green-600' : 'text-red-600'}`}>
                        {stat.changePositive ? (
                          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                          </svg>
                        ) : (
                          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                          </svg>
                        )}
                        <span>{stat.change}</span>
                      </div>
                    )}
                  </dd>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export const defaultStats: StatsCard[] = [
  {
    title: 'Monthly Listeners',
    value: '24.5K',
    change: '12%',
    changePositive: true,
    icon: <Headphones className="h-5 w-5" />,
    iconBgClass: 'bg-blue-500 bg-opacity-10',
    iconColorClass: 'text-blue-500',
  },
  {
    title: 'Total Streams',
    value: '183.2K',
    change: '8.1%',
    changePositive: true,
    icon: <Play className="h-5 w-5" />,
    iconBgClass: 'bg-green-500 bg-opacity-10',
    iconColorClass: 'text-green-500',
  },
  {
    title: 'Subscribers',
    value: '1,024',
    change: '4.2%',
    changePositive: true,
    icon: <Users className="h-5 w-5" />,
    iconBgClass: 'bg-purple-500 bg-opacity-10',
    iconColorClass: 'text-purple-500',
  },
  {
    title: 'Monthly Earnings',
    value: '$3,240',
    change: '7.5%',
    changePositive: true,
    icon: <CreditCard className="h-5 w-5" />,
    iconBgClass: 'bg-yellow-500 bg-opacity-10',
    iconColorClass: 'text-yellow-500',
  },
];
