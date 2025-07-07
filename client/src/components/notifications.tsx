import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, BellRing, X, Trophy, Star, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import { getLevelInfo } from "@/lib/levelSystem";
import { useAuth } from "@/contexts/auth-context";

interface Notification {
  id: number;
  userId: string;
  type: 'badge_earned' | 'points_awarded' | 'level_up' | 'general';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  metadata?: {
    badgeId?: number;
    badgeName?: string;
    badgeIcon?: string;
    points?: number;
    level?: number;
  };
}

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["/api/notifications"],
    enabled: isAuthenticated, // Only run when authenticated
    refetchInterval: isAuthenticated ? 60000 : false, // Only poll when authenticated
    staleTime: 30000, // Consider data stale after 30 seconds
    refetchOnWindowFocus: false,
  });

  // Don't render anything if user is not authenticated
  if (!isAuthenticated) {
    return null;
  }

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      return apiRequest(`/api/notifications/${notificationId}/read`, "PATCH");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  const unreadCount = notifications.filter((n: Notification) => !n.isRead).length;

  const getNotificationIcon = (notification: Notification) => {
    switch (notification.type) {
      case 'badge_earned':
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 'points_awarded':
        return <Star className="h-5 w-5 text-blue-500" />;
      case 'level_up':
        return <Gift className="h-5 w-5 text-purple-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const handleMarkAsRead = (notificationId: number) => {
    markAsReadMutation.mutate(notificationId);
  };

  if (isLoading) {
    return (
      <Button variant="ghost" size="icon" disabled>
        <Bell className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          {unreadCount > 0 ? (
            <BellRing className="h-5 w-5" />
          ) : (
            <Bell className="h-5 w-5" />
          )}
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center justify-between">
              Notifications
              {unreadCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {unreadCount} new
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-80">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No notifications yet</p>
                  <p className="text-sm">Keep tracking moments to earn badges!</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {notifications.map((notification: Notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 border-b last:border-b-0 hover:bg-muted/50 transition-colors ${
                        !notification.isRead ? 'bg-blue-50 dark:bg-blue-950/20' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          {getNotificationIcon(notification)}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-start justify-between">
                            <h4 className={`text-sm font-medium leading-5 ${
                              !notification.isRead ? 'text-primary' : ''
                            }`}>
                              {notification.title}
                            </h4>
                            {!notification.isRead && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 ml-2"
                                onClick={() => handleMarkAsRead(notification.id)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground leading-5">
                            {notification.message}
                          </p>
                          {notification.metadata && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              {notification.metadata.badgeName && (
                                <span className="flex items-center gap-1">
                                  {notification.metadata.badgeIcon} {notification.metadata.badgeName}
                                </span>
                              )}
                              {notification.metadata.points && (
                                <span className="flex items-center gap-1">
                                  <Star className="h-3 w-3" />
                                  +{notification.metadata.points} points
                                </span>
                              )}
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
}

// Points and level display component
export function UserPointsDisplay() {
  const { isAuthenticated } = useAuth();
  
  const { data: user } = useQuery({
    queryKey: ["/api/me"],
    enabled: isAuthenticated, // Only run when authenticated
  });

  const { data: userBadges } = useQuery({
    queryKey: ["/api/user-badges"],
    enabled: isAuthenticated, // Only run when authenticated
  });

  // Don't render anything if user is not authenticated
  if (!isAuthenticated || !user) return null;

  const levelInfo = getLevelInfo(user.points || 0);
  
  // Get the latest badge
  const latestBadge = userBadges && Array.isArray(userBadges) && userBadges.length > 0 
    ? userBadges.sort((a: any, b: any) => new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime())[0]
    : null;

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-1">
        <Trophy className="h-3 w-3 text-amber-500" />
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">Level {levelInfo.level}</span>
          <span className="text-[10px] text-muted-foreground">{levelInfo.title}</span>
        </div>
      </div>
      
      {latestBadge && (
        <div className="flex items-center gap-1 bg-purple-100/50 dark:bg-purple-900/20 px-2 py-1 rounded-md">
          <span className="text-sm">{latestBadge.badge?.icon || "🏆"}</span>
          <span className="text-xs font-medium text-purple-700 dark:text-purple-300">
            {latestBadge.badge?.name}
          </span>
        </div>
      )}
    </div>
  );
}