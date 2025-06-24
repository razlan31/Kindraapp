import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";

interface BadgeNotification {
  id: number;
  type: string;
  title: string;
  message: string;
  badgeId: number | null;
  pointsAwarded: number | null;
  isRead: boolean;
  createdAt: string;
}

export function useBadgeNotifications() {
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const lastNotificationId = useRef<number>(0);

  // Initialize from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('lastSeenNotificationId');
    if (stored) {
      lastNotificationId.current = parseInt(stored, 10);
    }
  }, []);

  // Poll for notifications every 30 seconds, but only if authenticated
  const { data: notifications } = useQuery({
    queryKey: ["/api/notifications"],
    refetchInterval: 30000,
    staleTime: 25000,
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (!notifications || !Array.isArray(notifications)) return;

    // On first load, if we have notifications but no stored ID, set it to the highest existing ID
    const stored = localStorage.getItem('lastSeenNotificationId');
    if (!stored && notifications.length > 0) {
      const allNotificationIds = notifications.map((n: BadgeNotification) => n.id);
      const maxExistingId = Math.max(...allNotificationIds);
      lastNotificationId.current = maxExistingId;
      localStorage.setItem('lastSeenNotificationId', maxExistingId.toString());
      return; // Don't show toasts for existing notifications on first load
    }

    // Filter for new badge unlock notifications
    const newBadgeNotifications = notifications.filter(
      (notification: BadgeNotification) =>
        notification.type === "badge_unlock" &&
        notification.id > lastNotificationId.current
    );

    if (newBadgeNotifications.length > 0) {
      // Update the last seen notification ID
      const maxId = Math.max(...newBadgeNotifications.map(n => n.id));
      lastNotificationId.current = maxId;
      
      // Store in localStorage to persist across restarts
      localStorage.setItem('lastSeenNotificationId', maxId.toString());

      // Show toast for each new badge notification
      newBadgeNotifications.forEach((notification: BadgeNotification) => {
        toast({
          title: "🎉 Badge Unlocked!",
          description: notification.message,
          duration: 5000,
          className: "bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0",
        });
      });
    }
  }, [notifications, toast]);

  return { notifications };
}