import { Header } from "@/components/layout/header";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { useAuth } from "@/contexts/auth-context";
import { useQuery } from "@tanstack/react-query";
import { Connection, Moment } from "@shared/schema";
import { AIChat } from "@/components/ai-chat";

export default function InsightsNew() {
  const { user, loading } = useAuth();

  // Query data (needed for AIChat functionality)
  const { data: connections = [] } = useQuery<Connection[]>({
    queryKey: ['/api/connections'],
    enabled: !!user
  });

  const { data: moments = [] } = useQuery<Moment[]>({
    queryKey: ['/api/moments'],
    enabled: !!user
  });

  console.log("InsightsNew - user:", !!user, "user ID:", user?.id, "loading:", loading);
  console.log("InsightsNew - moments query:", {
    momentsLength: moments.length,
    momentsLoading: loading,
    momentsError: null,
    userEnabled: !!user,
    loading
  });

  if (loading) {
    return (
      <div className="max-w-md mx-auto bg-white dark:bg-neutral-900 min-h-screen flex flex-col relative">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-neutral-600 dark:text-neutral-400">Loading...</p>
          </div>
        </main>
        <BottomNavigation />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto bg-white dark:bg-neutral-900 min-h-screen flex flex-col relative">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-neutral-600 dark:text-neutral-400">Please log in to access Luna AI</p>
          </div>
        </main>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white dark:bg-neutral-900 min-h-screen flex flex-col relative">
      <Header />

      <main className="flex-1 px-4 pt-6 pb-20 h-[calc(100vh-60px)]">
        {/* Luna AI - Main Feature */}
        <AIChat />
      </main>

      <BottomNavigation />
    </div>
  );
}