import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Trophy, Lock, Star, Award, Target, Calendar, Heart, MessageCircle, UserPlus, Zap, ArrowLeft } from "lucide-react";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { Header } from "@/components/layout/header";

interface Badge {
  id: number;
  name: string;
  description: string;
  icon: string;
  category: string;
  unlockCriteria: any;
  isRepeatable: boolean | null;
}

interface UserBadge {
  id: number;
  userId: number;
  badgeId: number;
  unlockedAt: string;
  badge: Badge;
}

function BadgeCard({ badge, isEarned, earnedCount = 0, progress }: { 
  badge: Badge; 
  isEarned: boolean; 
  earnedCount?: number;
  progress?: number;
}) {
  if (!badge) {
    return null;
  }
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Getting Started": return <UserPlus className="w-4 h-4" />;
      case "Relationship Progress": return <Heart className="w-4 h-4" />;
      case "Activity Tracking": return <Target className="w-4 h-4" />;
      case "Positivity": return <Star className="w-4 h-4" />;
      case "Conflict Resolution": return <MessageCircle className="w-4 h-4" />;
      case "Intimacy": return <Zap className="w-4 h-4" />;
      case "Self Growth": return <Award className="w-4 h-4" />;
      case "Meta Achievements": return <Trophy className="w-4 h-4" />;
      case "Legendary": return <Trophy className="w-4 h-4 text-yellow-500" />;
      default: return <Award className="w-4 h-4" />;
    }
  };

  return (
    <Card className={`relative overflow-hidden transition-all duration-200 hover:shadow-md ${
      isEarned ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200 dark:from-yellow-950/20 dark:to-orange-950/20 dark:border-yellow-800/30' : 'opacity-75'
    }`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{badge?.icon || '🏆'}</span>
            <div>
              <CardTitle className={`text-sm leading-tight ${isEarned ? 'text-yellow-700 dark:text-yellow-300' : 'text-gray-600 dark:text-gray-400'}`}>
                {badge?.name || 'Badge'}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs px-2 py-0">
                  <span className="mr-1">{getCategoryIcon(badge?.category || 'Default')}</span>
                  {badge?.category || 'Badge'}
                </Badge>

              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-1">
            {isEarned ? (
              <div className="flex items-center gap-1">
                <Trophy className="w-4 h-4 text-yellow-600" />
                {earnedCount > 1 && (
                  <span className="text-xs font-medium text-yellow-600">×{earnedCount}</span>
                )}
              </div>
            ) : (
              <Lock className="w-4 h-4 text-gray-400" />
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <CardDescription className="text-sm leading-relaxed">
          {badge?.description || 'Achievement unlocked!'}
        </CardDescription>
        
        {!isEarned && progress !== undefined && progress > 0 && (
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CategorySection({ title, badges, userBadges, icon }: {
  title: string;
  badges: Badge[];
  userBadges: UserBadge[];
  icon: React.ReactNode;
}) {
  const earnedBadgeMap = new Map<number, UserBadge[]>();
  userBadges.forEach(ub => {
    if (!earnedBadgeMap.has(ub.badgeId)) {
      earnedBadgeMap.set(ub.badgeId, []);
    }
    earnedBadgeMap.get(ub.badgeId)!.push(ub);
  });

  const earnedCount = badges.filter(b => earnedBadgeMap.has(b.id)).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        <Badge variant="secondary">
          {earnedCount}/{badges.length}
        </Badge>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {badges.filter(badge => badge && badge.id).map(badge => {
          const earnedBadges = earnedBadgeMap.get(badge.id) || [];
          const isEarned = earnedBadges.length > 0;
          
          return (
            <BadgeCard
              key={badge.id}
              badge={badge}
              isEarned={isEarned}
              earnedCount={earnedBadges.length}
            />
          );
        })}
      </div>
    </div>
  );
}

export default function BadgesPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [, setLocation] = useLocation();

  const { data: userBadges = [], isLoading: userBadgesLoading } = useQuery<UserBadge[]>({
    queryKey: ["/api/badges"],
  });

  const { data: allBadges = [], isLoading: allBadgesLoading } = useQuery<Badge[]>({
    queryKey: ["/api/badges/all"],
  });

  const isLoading = userBadgesLoading || allBadgesLoading;

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Loading badges...</p>
        </div>
      </div>
    );
  }

  const earnedBadgeIds = new Set(userBadges.map(ub => ub.badgeId));
  const earnedBadges = userBadges.filter(ub => ub.badge && ub.badge.id);
  const unearnedBadges = allBadges.filter(badge => badge && badge.id && !earnedBadgeIds.has(badge.id));

  // Group badges by category
  const badgesByCategory = allBadges.reduce((acc: Record<string, Badge[]>, badge) => {
    if (!badge || !badge.category) return acc;
    if (!acc[badge.category]) {
      acc[badge.category] = [];
    }
    acc[badge.category].push(badge);
    return acc;
  }, {} as Record<string, Badge[]>);

  const categoryIcons = {
    "Getting Started": <UserPlus className="w-5 h-5 text-blue-500" />,
    "Relationship Progress": <Heart className="w-5 h-5 text-pink-500" />,
    "Activity Tracking": <Target className="w-5 h-5 text-green-500" />,
    "Positivity": <Star className="w-5 h-5 text-yellow-500" />,
    "Conflict Resolution": <MessageCircle className="w-5 h-5 text-orange-500" />,
    "Intimacy": <Zap className="w-5 h-5 text-red-500" />,
    "Self Growth": <Award className="w-5 h-5 text-purple-500" />,
    "Meta Achievements": <Trophy className="w-5 h-5 text-indigo-500" />,
    "Legendary": <Trophy className="w-5 h-5 text-yellow-600" />,
  };

  const completionPercentage = Math.round((earnedBadgeIds.size / allBadges.length) * 100);

  return (
    <div className="bg-neutral-50 dark:bg-neutral-900">
      <Header />
      <main className="container mx-auto p-4 max-w-7xl" style={{ paddingBottom: '5rem', minHeight: 'calc(100vh - 4rem - 4rem)' }}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setLocation("/")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </div>
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Badge Collection</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Track your relationship journey achievements
          </p>
        </div>
        
        {/* Overall Progress */}
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold mb-2">{earnedBadgeIds.size}/{allBadges.length}</div>
              <Progress value={completionPercentage} className="mb-2" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {completionPercentage}% Complete
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All Badges</TabsTrigger>
          <TabsTrigger value="earned">Earned ({earnedBadgeIds.size})</TabsTrigger>
          <TabsTrigger value="available">Available ({unearnedBadges.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-8">
          {Object.entries(badgesByCategory).map(([category, badges]) => (
            <CategorySection
              key={category}
              title={category}
              badges={badges}
              userBadges={userBadges}
              icon={categoryIcons[category as keyof typeof categoryIcons] || <Award className="w-5 h-5" />}
            />
          ))}
        </TabsContent>

        <TabsContent value="earned" className="space-y-6">
          {earnedBadges.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userBadges.filter(userBadge => userBadge.badge).map((userBadge) => (
                <BadgeCard
                  key={userBadge.id}
                  badge={userBadge.badge}
                  isEarned={true}
                  earnedCount={userBadges.filter(ub => ub.badgeId === userBadge.badgeId).length}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Trophy className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">
                No Badges Yet
              </h3>
              <p className="text-gray-500 dark:text-gray-500">
                Start tracking your relationships to earn your first badge!
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="available" className="space-y-6">
          {unearnedBadges.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {unearnedBadges.filter(badge => badge && badge.id).map((badge) => (
                <BadgeCard
                  key={badge.id}
                  badge={badge}
                  isEarned={false}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Star className="w-16 h-16 mx-auto text-yellow-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">
                All Badges Earned!
              </h3>
              <p className="text-gray-500 dark:text-gray-500">
                Congratulations! You've unlocked every badge available.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
      </main>
      <BottomNavigation />
    </div>
  );
}