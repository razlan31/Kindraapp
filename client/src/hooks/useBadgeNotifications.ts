import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

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
  const lastNotificationId = useRef<number>(0);

  // Initialize from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('lastSeenNotificationId');
    if (stored) {
      lastNotificationId.current = parseInt(stored, 10);
    }
  }, []);

  // Poll for notifications every 3 seconds
  const { data: notifications } = useQuery({
    queryKey: ["/api/notifications"],
    refetchInterval: 3000,
    staleTime: 0,
  });

  useEffect(() => {
    if (!notifications || !Array.isArray(notifications)) return;

    // Filter for new badge unlock notifications
    const newBadgeNotifications = notifications.filter(
      (notification: BadgeNotification) =>
        notification.type === "badge_unlock" &&
        notification.id > lastNotificationId.current &&
        !notification.isRead
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