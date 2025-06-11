import { useBadgeNotifications } from "@/hooks/useBadgeNotifications";
import { useAuth } from "@/contexts/auth-context";

export function BadgeNotificationMonitor() {
  const { isAuthenticated } = useAuth();
  
  // Always call the hook, but it will handle authentication internally
  useBadgeNotifications();
  
  // This component doesn't render anything - it just monitors for notifications
  return null;
}