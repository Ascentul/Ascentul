import { cn } from '@/lib/utils';
import { 
  Rocket, 
  Target, 
  GraduationCap, 
  Briefcase, 
  Award, 
  Star, 
  BookOpen, 
  FileText, 
  Users, 
  Lock 
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface AchievementBadgeProps {
  name: string;
  description: string;
  icon: string;
  xpReward: number;
  unlocked: boolean;
  earnedAt?: Date;
}

export default function AchievementBadge({
  name,
  description,
  icon,
  xpReward,
  unlocked,
  earnedAt,
}: AchievementBadgeProps) {
  // Map string icon names to components
  const getIcon = () => {
    if (!unlocked) return <Lock className="text-neutral-400 text-xl" />;
    
    switch (icon.toLowerCase()) {
      case 'rocket':
        return <Rocket className="text-[#8bc34a] text-xl" />;
      case 'bullseye':
      case 'target':
        return <Target className="text-[#8bc34a] text-xl" />;
      case 'graduation-cap':
        return <GraduationCap className="text-[#8bc34a] text-xl" />;
      case 'briefcase':
        return <Briefcase className="text-[#8bc34a] text-xl" />;
      case 'award':
        return <Award className="text-[#8bc34a] text-xl" />;
      case 'star':
        return <Star className="text-[#8bc34a] text-xl" />;
      case 'book':
        return <BookOpen className="text-[#8bc34a] text-xl" />;
      case 'file':
        return <FileText className="text-[#8bc34a] text-xl" />;
      case 'users':
        return <Users className="text-[#8bc34a] text-xl" />;
      default:
        return <Award className="text-[#8bc34a] text-xl" />;
    }
  };

  return (
    <Card className={cn(
      "shadow-sm p-4 flex flex-col items-center text-center",
      !unlocked && "opacity-50"
    )}>
      <div className={cn(
        "relative w-20 h-20 rounded-full flex items-center justify-center mb-3",
        unlocked 
          ? "bg-[#8bc34a]/10 before:content-[''] before:absolute before:w-[70px] before:h-[70px] before:rounded-full before:bg-[#8bc34a]/5"
          : "bg-neutral-200/50 before:content-[''] before:absolute before:w-[70px] before:h-[70px] before:rounded-full before:bg-neutral-200/30"
      )}>
        {getIcon()}
      </div>
      <h3 className={cn(
        "text-sm font-medium",
        !unlocked && "text-neutral-400"
      )}>
        {name}
      </h3>
      <p className={cn(
        "text-xs text-neutral-500 mt-1",
        !unlocked && "text-neutral-400"
      )}>
        {description}
      </p>
      <p className={cn(
        "text-xs mt-2",
        unlocked ? "text-[#8bc34a]" : "text-neutral-400"
      )}>
        +{xpReward} XP
      </p>
      {earnedAt && unlocked && (
        <p className="text-xs text-neutral-400 mt-1">
          Earned {earnedAt.toLocaleDateString()}
        </p>
      )}
    </Card>
  );
}
