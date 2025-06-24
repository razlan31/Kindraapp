import { useAuth } from "@/contexts/auth-context";
import { AIChat } from "@/components/ai-chat";
import { Header } from "@/components/layout/header";

export default function Luna() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-violet-600 dark:text-violet-400 mb-2">
            🌙 Luna AI
          </div>
          <p className="text-gray-600 dark:text-gray-400">Please log in to chat with Luna AI</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      <Header />
      <main className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="text-4xl">🌙</div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                Luna AI Coach
              </h1>
            </div>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Your personal relationship coach powered by AI. Ask Luna anything about relationships, dating, communication, and personal growth.
            </p>
          </div>
          
          <AIChat />
        </div>
      </main>
    </div>
  );
}