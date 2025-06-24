import { Header } from "@/components/layout/header";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { useAuth } from "@/contexts/auth-context";
import AIChat from "@/components/ai-chat-clean";

export default function Homepage1() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="max-w-md mx-auto bg-white dark:bg-neutral-900 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-neutral-600 dark:text-neutral-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto bg-white dark:bg-neutral-900 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-neutral-600 dark:text-neutral-400">Please log in to continue</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white dark:bg-neutral-900 min-h-screen flex flex-col relative">
      <Header />

      <main className="flex-1 overflow-y-auto pb-20 px-4 pt-6">
        {/* Luna AI - Relationship Coach Only */}
        <AIChat />
      </main>

      <BottomNavigation />
    </div>
  );
}