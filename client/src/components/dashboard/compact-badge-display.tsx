import { useQuery } from "@tanstack/react-query";
import { Trophy, Star, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

interface Badge {
  id: number;
  name: string;
  icon: string;
  points: number | null;
}

interface UserBadge {
  id: number;
  badgeId: number;
  unlockedAt: Date | null;
}

interface User {
  points?: number;
  [key: string]: any;
}

export function CompactBadgeDisplay() {
  // Fetch user data for points and level
  const { data: user } = useQuery<User>({
    queryKey: ["/api/me"],
  });

  // Fetch user badges
  const { data: userBadges = [] } = useQuery<UserBadge[]>({
    queryKey: ["/api/user-badges"],
  });

  // Fetch all badges to get badge details
  const { data: badges = [] } = useQuery<Badge[]>({
    queryKey: ["/api/badges"],
  });

  if (!user) return null;

  // Calculate level based on points
  const level = Math.floor((user.points || 0) / 100) + 1;
  const pointsToNextLevel = 100 - ((user.points || 0) % 100);

  // Get latest badge
  const latestUserBadge = userBadges
    .filter(ub => ub.unlockedAt)
    .sort((a, b) => new Date(b.unlockedAt!).getTime() - new Date(a.unlockedAt!).getTime())[0];

  const latestBadge = latestUserBadge 
    ? badges.find(b => b.id === latestUserBadge.badgeId)
    : null;

  return (
    <section className="px-3 py-2">
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 border border-yellow-200 dark:border-yellow-800/30 rounded-xl p-3">
        <div className="flex items-center justify-between">
          {/* Left side: Points and Level */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 text-yellow-500" />
              <span className="font-medium text-sm">{user.points || 0} pts</span>
            </div>
            <div className="flex items-center gap-1">
              <Trophy className="h-4 w-4 text-amber-500" />
              <span className="font-medium text-sm">Level {level}</span>
            </div>
            <span className="text-xs text-muted-foreground">
              ({pointsToNextLevel} to next level)
            </span>
          </div>

          {/* Right side: Latest Badge + Link to Badges Page */}
          <div className="flex items-center gap-2">
            {latestBadge && (
              <div className="flex items-center gap-1">
                <span className="text-lg">{latestBadge.icon}</span>
                <span className="text-xs text-yellow-700 dark:text-yellow-300 font-medium">
                  {latestBadge.name}
                </span>
              </div>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              asChild
              className="h-6 px-2 text-xs text-yellow-700 dark:text-yellow-300 hover:bg-yellow-100 dark:hover:bg-yellow-900/30"
            >
              <Link href="/badges">
                <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}