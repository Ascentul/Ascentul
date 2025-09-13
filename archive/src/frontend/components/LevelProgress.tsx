import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface LevelProgressProps {
  level: number;
  xp: number;
  nextLevelXp: number;
  rank: string;
  nextRank: string;
}

export default function LevelProgress({
  level,
  xp,
  nextLevelXp,
  rank,
  nextRank,
}: LevelProgressProps) {
  // Calculate the percentage of XP towards the next level
  const percentage = Math.min(100, Math.round((xp / nextLevelXp) * 100));
  
  // Calculate the stroke dashoffset for the progress ring
  // The circle has a radius of 45 and circumference of 2 * PI * 45 = ~283
  const circumference = 2 * Math.PI * 45;
  const dashOffset = circumference * (1 - percentage / 100);

  return (
    <Card>
      <CardContent className="p-5">
        <h2 className="text-lg font-semibold mb-4 font-poppins">Level Progress</h2>
        <div className="flex flex-col items-center">
          <div className="relative">
            <svg className="transform -rotate-90" width="120" height="120">
              <circle 
                className="text-neutral-200" 
                stroke="currentColor" 
                strokeWidth="8" 
                fill="transparent" 
                r="45" 
                cx="60" 
                cy="60"
              />
              <circle 
                className="text-primary" 
                stroke="currentColor" 
                strokeWidth="8" 
                fill="transparent" 
                r="45" 
                cx="60" 
                cy="60" 
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <span className="text-2xl font-bold">{percentage}%</span>
              </div>
            </div>
          </div>
          <div className="mt-4 text-center">
            <h3 className="text-lg font-medium font-poppins">{rank}</h3>
            <p className="text-neutral-500 text-sm mt-1">Level {level}</p>
            <p className="mt-3">
              <span className="font-medium">{xp}</span> / {nextLevelXp} XP
            </p>
          </div>
          <div className="mt-6">
            <p className="text-sm text-center mb-2">Next milestone: <span className="font-semibold">{nextRank}</span></p>
            <Button variant="outline" className="w-full bg-primary/10 text-primary hover:bg-primary/20">
              View Level Benefits
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
