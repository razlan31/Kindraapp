import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { Trophy, Star, Award, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

interface UserBadge {
  id: number;
  userId: number;
  badgeId: number;
  pointsAwarded: number;
  unlockedAt: string;
}

interface Badge {
  id: number;
  name: string;
  description: string;
  icon: string;
  category: string;
  points: number;
  criteria: any;
}

export function MiniBadgeDashboard() {
  const { user } = useAuth();

  // Fetch user badges
  const { data: userBadges = [] } = useQuery<UserBadge[]>({
    queryKey: ["/api/badges"],
    enabled: !!user,
  });

  // Fetch all badges to get details
  const { data: allBadges = [] } = useQuery<Badge[]>({
    queryKey: ["/api/badges/all"],
    enabled: !!user,
  });

  if (!user) {
    return null;
  }

  // Calculate user stats
  const level = Math.floor((user.points || 0) / 100) + 1;
  const pointsToNextLevel = 100 - ((user.points || 0) % 100);
  const badgeCount = userBadges.length;

  // Get latest badge
  const latestUserBadge = userBadges
    .filter((ub) => ub.unlockedAt)
    .sort((a, b) => new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime())[0];

  const latestBadge = latestUserBadge 
    ? allBadges.find((b) => b.id === latestUserBadge.badgeId)
    : null;

  return (
    <section className="px-3 py-2">
      <div className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20 border border-amber-200 dark:border-amber-800/30 rounded-xl p-3">
        <div className="flex items-center justify-between">
          {/* Left: Stats */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 text-amber-500" />
              <span className="font-medium text-sm text-amber-800 dark:text-amber-200">
                {user.points || 0} pts
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Trophy className="h-4 w-4 text-yellow-600" />
              <span className="font-medium text-sm text-yellow-800 dark:text-yellow-200">
                Level {level}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Award className="h-4 w-4 text-orange-500" />
              <span className="font-medium text-sm text-orange-800 dark:text-orange-200">
                {badgeCount} badges
              </span>
            </div>
          </div>

          {/* Right: Latest Badge + Link */}
          <div className="flex items-center gap-2">
            {latestBadge && (
              <div className="flex items-center gap-1 px-2 py-1 bg-amber-100 dark:bg-amber-900/30 rounded-md">
                <span className="text-sm">{latestBadge.icon}</span>
                <span className="text-xs font-medium text-amber-800 dark:text-amber-200">
                  {latestBadge.name}
                </span>
              </div>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              asChild
              className="h-7 px-2 text-xs text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/30"
            >
              <Link href="/badges">
                View All <ArrowRight className="h-3 w-3 ml-1" />
              </Link>
            </Button>
          </div>
        </div>
        
        {/* Progress bar for next level */}
        <div className="mt-2">
          <div className="flex items-center justify-between text-xs text-amber-700 dark:text-amber-300 mb-1">
            <span>Progress to Level {level + 1}</span>
            <span>{pointsToNextLevel} points needed</span>
          </div>
          <div className="w-full bg-amber-200 dark:bg-amber-900/40 rounded-full h-1.5">
            <div 
              className="bg-amber-500 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${((100 - pointsToNextLevel) / 100) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}