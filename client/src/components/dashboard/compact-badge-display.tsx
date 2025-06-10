import { useAuth } from "@/contexts/auth-context";
import { Trophy, Star, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

interface User {
  points?: number;
  [key: string]: any;
}

export function CompactBadgeDisplay() {
  console.log("🎯 CompactBadgeDisplay: Component is rendering");
  const { user, loading } = useAuth();

  console.log("🎯 CompactBadgeDisplay: User data:", user, "loading:", loading);
  
  // Always show the component for debugging
  console.log("🎯 CompactBadgeDisplay: Rendering component regardless of user state");
  
  if (loading) {
    console.log("CompactBadgeDisplay: Loading, showing placeholder");
    return (
      <section className="px-3 py-2">
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 border border-yellow-200 dark:border-yellow-800/30 rounded-xl p-3">
          <div className="animate-pulse text-yellow-800 dark:text-yellow-200">Loading badges...</div>
        </div>
      </section>
    );
  }
  
  if (!user) {
    console.log("CompactBadgeDisplay: No user, showing fallback");
    return (
      <section className="px-3 py-2">
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 border border-yellow-200 dark:border-yellow-800/30 rounded-xl p-3">
          <div className="text-yellow-800 dark:text-yellow-200">Please log in to view badges</div>
        </div>
      </section>
    );
  }

  console.log("CompactBadgeDisplay: User has points:", user.points);

  // Calculate level based on points
  const level = Math.floor((user.points || 0) / 100) + 1;
  const pointsToNextLevel = 100 - ((user.points || 0) % 100);

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

          {/* Right side: Link to Badges Page */}
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              asChild
              className="h-6 px-2 text-xs text-yellow-700 dark:text-yellow-300 hover:bg-yellow-100 dark:hover:bg-yellow-900/30"
            >
              <Link href="/badges">
                View Badges <ArrowRight className="h-3 w-3 ml-1" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}