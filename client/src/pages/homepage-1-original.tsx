import { useAuth } from "@/contexts/auth-context";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { Header } from "@/components/layout/header";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { AIChat } from "@/components/ai-chat-clean";

export default function Homepage1() {
  const { user, isAuthenticated, loading } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      setLocation('/login');
    }
  }, [isAuthenticated, loading, setLocation]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm sm:max-w-md lg:max-w-lg mx-auto bg-white dark:bg-neutral-900 min-h-screen flex flex-col relative overflow-hidden">
      <Header />

      <main className="flex-1 overflow-y-auto pb-20 px-3 sm:px-4 lg:px-6 pt-4 sm:pt-6 lg:pt-8">
        {/* Luna AI - Relationship Coach Only */}
        <AIChat />
      </main>

      <BottomNavigation />
    </div>
  );
}