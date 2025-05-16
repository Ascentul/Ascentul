import { Award, Briefcase, ExternalLink, GraduationCap, Medal, MoreHorizontal, Pencil, Star, Trash2, Trophy } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserPersonalAchievement } from "@/utils/schema";

type IconProps = {
  name: string;
  className?: string;
};

const AchievementIcon = ({ name, className }: IconProps) => {
  switch (name) {
    case "award":
      return <Award className={className} />;
    case "briefcase":
      return <Briefcase className={className} />;
    case "graduation":
      return <GraduationCap className={className} />;
    case "medal":
      return <Medal className={className} />;
    case "star":
      return <Star className={className} />;
    case "trophy":
      return <Trophy className={className} />;
    default:
      return <Award className={className} />;
  }
};

// Map categories to colors
const categoryColors: Record<string, string> = {
  professional: "bg-blue-500/10 text-blue-500",
  academic: "bg-green-500/10 text-green-500",
  personal: "bg-purple-500/10 text-purple-500",
  certification: "bg-orange-500/10 text-orange-500",
  award: "bg-yellow-500/10 text-yellow-500",
};

type PersonalAchievementCardProps = {
  achievement: UserPersonalAchievement;
  onEdit?: (achievement: UserPersonalAchievement) => void;
  onDelete?: (id: number) => void;
};

export default function PersonalAchievementCard({
  achievement,
  onEdit,
  onDelete,
}: PersonalAchievementCardProps) {
  const iconColor = achievement.category === "professional" 
    ? "text-blue-500" 
    : achievement.category === "academic" 
    ? "text-green-500" 
    : achievement.category === "personal"
    ? "text-purple-500"
    : achievement.category === "certification"
    ? "text-orange-500"
    : "text-yellow-500";

  const bgColor = achievement.category === "professional" 
    ? "bg-blue-500/10" 
    : achievement.category === "academic" 
    ? "bg-green-500/10" 
    : achievement.category === "personal"
    ? "bg-purple-500/10"
    : achievement.category === "certification"
    ? "bg-orange-500/10"
    : "bg-yellow-500/10";

  return (
    <Card className="overflow-hidden">
      <div className={`h-2 ${bgColor.replace("/10", "/70")}`}></div>
      <CardContent className="pt-6 pb-4">
        <div className="flex gap-4">
          <div className={`h-12 w-12 rounded-full ${bgColor} flex items-center justify-center flex-shrink-0`}>
            <AchievementIcon name={achievement.icon} className={`h-6 w-6 ${iconColor}`} />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <h3 className="font-medium text-base line-clamp-1">{achievement.title}</h3>
              
              {(onEdit || onDelete) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {onEdit && (
                      <DropdownMenuItem onClick={() => onEdit(achievement)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                    )}
                    {onDelete && (
                      <>
                        {onEdit && <DropdownMenuSeparator />}
                        <DropdownMenuItem
                          onClick={() => onDelete(achievement.id)}
                          className="text-red-500 focus:text-red-500"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
            
            <p className="text-sm text-neutral-500 line-clamp-2 mt-1">
              {achievement.description}
            </p>
            
            <div className="flex flex-wrap gap-2 mt-3">
              <Badge variant="outline" className="capitalize">
                {achievement.category}
              </Badge>
              
              {achievement.skills && (
                <Badge variant="secondary" className="text-xs">
                  {achievement.skills}
                </Badge>
              )}
              
              <Badge variant="outline" className={`${iconColor} ${bgColor}`}>
                +{achievement.xpValue} XP
              </Badge>
            </div>
            
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 text-xs text-neutral-500">
              {achievement.achievementDate && (
                <span>
                  {format(new Date(achievement.achievementDate), "MMM d, yyyy")}
                </span>
              )}
              
              {achievement.issuingOrganization && (
                <span className="font-medium">
                  {achievement.issuingOrganization}
                </span>
              )}
              
              {achievement.proofUrl && (
                <a
                  href={achievement.proofUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-primary hover:underline"
                >
                  <ExternalLink className="h-3 w-3 mr-1" /> View Proof
                </a>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}