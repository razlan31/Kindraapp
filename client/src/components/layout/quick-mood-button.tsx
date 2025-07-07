import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Smile, Plus } from "lucide-react";
import { useModal } from "@/contexts/modal-context";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Connection } from "@shared/schema";
import { useAuth } from "@/contexts/auth-context";

export function QuickMoodButton() {
  const { openMomentModal, setSelectedConnection: setModalSelectedConnection } = useModal();
  const [location] = useLocation();
  const [showConnections, setShowConnections] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState<Connection | null>(null);
  const { isAuthenticated } = useAuth();
  
  // Only show on specific pages
  const shouldShow = ["/", "/dashboard", "/moments", "/connections"].includes(location);
  
  // Hide connections dropdown when clicking elsewhere
  useEffect(() => {
    const handleClickOutside = () => setShowConnections(false);
    if (showConnections) {
      document.addEventListener("click", handleClickOutside);
    }
    return () => document.removeEventListener("click", handleClickOutside);
  }, [showConnections]);
  
  // Fetch connections
  const { data: connections = [] } = useQuery<Connection[]>({
    queryKey: ["/api/connections"],
    enabled: shouldShow && isAuthenticated && !!user, // Only run when authenticated and should show
  });
  
  if (!shouldShow) return null;

  return (
    <div className="fixed bottom-24 right-4 z-50 flex flex-col-reverse items-end gap-2">
      {/* Connection selection dropdown */}
      {showConnections && (
        <div 
          className="bg-white dark:bg-neutral-800 rounded-lg shadow-lg p-2 mb-2 animate-fadeIn w-52"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2 p-2">
            Track mood for:
          </p>
          <div className="max-h-40 overflow-y-auto space-y-1">
            {connections.map(connection => (
              <Button
                key={connection.id}
                variant="ghost"
                size="sm"
                className="w-full justify-start text-left"
                onClick={() => {
                  setSelectedConnection(connection);
                  setModalSelectedConnection(connection.id, connection);
                  setShowConnections(false);
                  // Use moment modal instead of mood tracker for proper date handling
                  openMomentModal('moment', undefined, new Date());
                }}
              >
                {connection.name}
              </Button>
            ))}
          </div>
        </div>
      )}
      
      {/* Main FAB button */}
      <Button
        variant="default"
        size="icon"
        className="h-12 w-12 rounded-full shadow-lg flex items-center justify-center bg-primary hover:bg-primary/90"
        onClick={(e) => {
          e.stopPropagation();
          setShowConnections(prev => !prev);
        }}
      >
        {showConnections ? (
          <Plus className="h-6 w-6" />
        ) : (
          <Smile className="h-6 w-6" />
        )}
      </Button>
    </div>
  );
}