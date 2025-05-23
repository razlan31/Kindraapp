import { Header } from "@/components/layout/header";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useQuery } from "@tanstack/react-query";
import { Badge as BadgeType } from "@shared/schema";
import { 
  Award, 
  Calendar, 
  Edit, 
  LogOut, 
  Settings, 
  Shield, 
  User, 
  Moon, 
  Sun
} from "lucide-react";
import { useTheme } from "@/components/theme-provider";

export default function Profile() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  // Fetch user badges
  const { data: userBadges = [] } = useQuery<any[]>({
    queryKey: ["/api/user-badges"],
    enabled: !!user,
  });

  // Fetch all badges for reference
  const { data: allBadges = [] } = useQuery<BadgeType[]>({
    queryKey: ["/api/badges"],
    enabled: !!user,
  });

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };
  
  const displayName = user?.displayName || user?.username || '';
  const initials = getInitials(displayName);

  const earnedBadgeIds = userBadges.map(ub => ub.badgeId);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <div className="max-w-md mx-auto bg-white dark:bg-neutral-900 min-h-screen flex flex-col relative">
      <Header />

      <main className="flex-1 overflow-y-auto pb-20">
        {/* Profile Header */}
        <section className="px-4 pt-5 pb-3">
          <div className="flex justify-between items-start">
            <div className="flex items-center">
              <Avatar className="h-20 w-20 mr-4">
                <AvatarImage src={user?.profileImage} alt={displayName} />
                <AvatarFallback className="text-lg bg-primary text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-heading font-semibold">{displayName}</h2>
                <p className="text-neutral-600 dark:text-neutral-400">@{user?.username}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {user?.zodiacSign && (
                    <Badge variant="outline" className="bg-accent/10 text-neutral-700 dark:text-neutral-300">
                      {user.zodiacSign}
                    </Badge>
                  )}
                  {user?.loveLanguage && (
                    <Badge variant="outline" className="bg-primary/10 text-primary">
                      {user.loveLanguage}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <Button variant="outline" size="icon">
              <Edit className="h-4 w-4" />
            </Button>
          </div>
        </section>

        <Separator className="mb-4" />

        {/* Badges Section */}
        <section className="px-4 py-3">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-heading font-semibold">Your Badges</h3>
            <Button variant="ghost" size="sm" className="text-sm text-primary">
              View All
            </Button>
          </div>
          
          <Card>
            <CardContent className="p-4">
              {userBadges.length > 0 ? (
                <div className="grid grid-cols-4 gap-4">
                  {allBadges.filter(badge => earnedBadgeIds.includes(badge.id))
                    .slice(0, 4)
                    .map(badge => (
                      <div key={badge.id} className="flex flex-col items-center">
                        <div className={`h-14 w-14 rounded-full bg-${getBadgeColorClass(badge.category)} flex items-center justify-center text-white text-xl mb-1 shadow-md`}>
                          <i className={`fa-solid ${badge.icon}`}></i>
                        </div>
                        <span className="text-xs text-center">{badge.name}</span>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <Award className="h-8 w-8 text-neutral-300 mx-auto mb-2" />
                  <p className="text-sm text-neutral-500">No badges earned yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Settings Section */}
        <section className="px-4 py-3">
          <h3 className="font-heading font-semibold mb-3">Settings</h3>
          
          <Card>
            <CardContent className="p-0">
              <Button variant="ghost" className="w-full justify-start rounded-none h-12 px-4">
                <User className="h-4 w-4 mr-3" />
                Account Settings
              </Button>
              <Separator />
              <Button variant="ghost" className="w-full justify-start rounded-none h-12 px-4">
                <Shield className="h-4 w-4 mr-3" />
                Privacy & Security
              </Button>
              <Separator />
              <Button 
                variant="ghost" 
                className="w-full justify-start rounded-none h-12 px-4"
                onClick={() => window.location.href = "/cycle-tracking"}
              >
                <Calendar className="h-4 w-4 mr-3" />
                Menstrual Cycle Tracking
              </Button>
              <Separator />
              <Button 
                variant="ghost" 
                className="w-full justify-start rounded-none h-12 px-4"
                onClick={toggleTheme}
              >
                {theme === 'light' ? (
                  <>
                    <Moon className="h-4 w-4 mr-3" />
                    Dark Mode
                  </>
                ) : (
                  <>
                    <Sun className="h-4 w-4 mr-3" />
                    Light Mode
                  </>
                )}
              </Button>
              <Separator />
              <Button 
                variant="ghost" 
                className="w-full justify-start rounded-none h-12 px-4 text-destructive hover:text-destructive"
                onClick={logout}
              >
                <LogOut className="h-4 w-4 mr-3" />
                Log Out
              </Button>
            </CardContent>
          </Card>
        </section>

        {/* App Info Section */}
        <section className="px-4 py-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">About Kindra</CardTitle>
              <CardDescription>
                Version 1.0.0
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Kindra helps you track, reflect on, and grow your emotional connections across various relationship types and stages.
              </p>
              <div className="mt-3 text-sm text-neutral-500 dark:text-neutral-500">
                <p>© 2023 Kindra. All rights reserved.</p>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>

      <BottomNavigation />
    </div>
  );
}

// Helper function to determine badge color based on category
function getBadgeColorClass(category: string): string {
  switch (category) {
    case "Emotional Growth":
      return "accent";
    case "Communication":
      return "secondary";
    case "Relationship Health":
      return "primary";
    case "Consistency":
      return "success";
    case "Self-care":
      return "warning";
    case "Diversity":
      return "redFlag";
    default:
      return "primary";
  }
}
