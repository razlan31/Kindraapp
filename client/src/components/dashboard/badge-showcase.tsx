import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@shared/schema";
import { Link } from "wouter";

interface BadgeShowcaseProps {
  badges: Badge[];
  earnedBadgeIds: number[];
}

export function BadgeShowcase({ badges, earnedBadgeIds }: BadgeShowcaseProps) {
  // Show max 4 badges in the showcase
  const displayBadges = badges.slice(0, 4);
  
  const getBadgeColorClass = (category: string, isLocked: boolean) => {
    if (isLocked) return "bg-neutral-300 dark:bg-neutral-700";
    
    switch (category) {
      case "Emotional Growth":
        return "bg-accent";
      case "Communication":
        return "bg-secondary";
      case "Relationship Health":
        return "bg-primary";
      case "Consistency":
        return "bg-success";
      case "Self-care":
        return "bg-warning";
      case "Diversity":
        return "bg-redFlag";
      default:
        return "bg-primary";
    }
  };
  
  return (
    <Card className="bg-neutral-100 dark:bg-neutral-800 rounded-xl p-4">
      <div className="grid grid-cols-4 gap-4">
        {displayBadges.map((badge) => {
          const isLocked = !earnedBadgeIds.includes(badge.id);
          return (
            <div key={badge.id} className="flex flex-col items-center">
              <div 
                className={`h-14 w-14 rounded-full ${getBadgeColorClass(badge.category, isLocked)} flex items-center justify-center text-white text-xl mb-1 ${!isLocked ? 'shadow-md' : ''}`}
              >
                {isLocked ? (
                  <i className="fa-solid fa-lock"></i>
                ) : (
                  <i className={`fa-solid ${badge.icon}`}></i>
                )}
              </div>
              <span className="text-xs text-center">{isLocked ? 'Locked' : badge.name}</span>
            </div>
          );
        })}
      </div>
      <CardContent className="p-0 text-center mt-3">
        <Button variant="link" asChild className="text-primary text-sm font-medium py-1">
          <Link href="/profile/badges">View All Badges</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
