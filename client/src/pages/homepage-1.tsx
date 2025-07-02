import { Header } from "@/components/layout/header";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { UpgradeBanner } from "@/components/subscription/upgrade-banner";
import { useAuth } from "@/contexts/auth-context";
import AIChat from "@/components/ai-chat-clean";

export default function Homepage1() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="max-w-md mx-auto bg-gradient-to-br from-blue-50 to-purple-50 min-h-screen flex items-center justify-center">
        <div className="text-center animate-slide-in-up">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-100 border-t-blue-500 mx-auto mb-6"></div>
            <div className="absolute inset-0 rounded-full h-12 w-12 border-4 border-purple-100 border-t-purple-500 mx-auto animate-spin animation-delay-2000"></div>
          </div>
          <p className="text-slate-600 font-medium">Loading your relationship coach...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto bg-gradient-to-br from-blue-50 to-purple-50 min-h-screen flex items-center justify-center">
        <div className="text-center animate-slide-in-up">
          <div className="bg-white rounded-2xl p-8 shadow-xl border border-white/20">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-white text-2xl">🤖</span>
            </div>
            <p className="text-slate-600 font-medium">Please log in to continue</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm sm:max-w-md lg:max-w-lg mx-auto min-h-screen flex flex-col relative bg-gradient-to-br from-blue-50/30 to-purple-50/30">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-10 w-32 h-32 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
        <div className="absolute top-40 right-10 w-32 h-32 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-40 left-20 w-32 h-32 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
      </div>
      
      <Header />

      <main className="flex-1 overflow-y-auto pb-24 px-4 pt-6 relative z-10">
        <div className="animate-slide-in-up">
          <UpgradeBanner 
            message="Free Plan: Limited AI coaching"
            description="Upgrade to Premium for unlimited AI coaching sessions and deeper relationship insights."
            variant="compact"
          />
        </div>
        
        <div className="animate-slide-in-up" style={{ animationDelay: '0.2s' }}>
          <AIChat />
        </div>
      </main>

      <BottomNavigation />
    </div>
  );
}