import { useBadgeNotifications } from "@/hooks/useBadgeNotifications";
import { useAuth } from "@/contexts/auth-context";

export function BadgeNotificationMonitor() {
  const { isAuthenticated } = useAuth();
  
  // Only monitor notifications if user is authenticated
  if (isAuthenticated) {
    useBadgeNotifications();
  }
  
  // This component doesn't render anything - it just monitors for notifications
  return null;
}