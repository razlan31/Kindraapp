import { useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AIChat } from "./ai-chat";
import { useLocation } from "wouter";

export function FloatingLuna() {
  const [isOpen, setIsOpen] = useState(false);
  const [location] = useLocation();
  
  // Don't show floating button on Luna page
  if (location === "/luna") {
    return null;
  }

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-[140px] right-4 z-50 w-14 h-14 rounded-full bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 shadow-lg hover:shadow-xl transition-all duration-200"
          size="icon"
        >
          <MessageCircle className="h-6 w-6 text-white" />
        </Button>
      )}

      {/* Slide-up Panel */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm">
          {/* Panel */}
          <Card className="fixed bottom-0 right-0 left-0 h-[80vh] rounded-t-2xl border-0 shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="text-2xl">🌙</div>
                <div>
                  <h2 className="font-semibold text-violet-700 dark:text-violet-300">Luna AI Coach</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Quick relationship advice</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            {/* Chat Content */}
            <div className="flex-1 overflow-hidden">
              <AIChat compact />
            </div>
          </Card>
        </div>
      )}
    </>
  );
}