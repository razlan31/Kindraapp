import { createContext, useContext, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Connection } from "@shared/schema";

type RelationshipFocusContextType = {
  mainFocusConnection: Connection | null;
  setMainFocusConnection: (connection: Connection | null) => void;
  loading: boolean;
};

const RelationshipFocusContext = createContext<RelationshipFocusContextType>({
  mainFocusConnection: null,
  setMainFocusConnection: () => {},
  loading: true,
});

export const useRelationshipFocus = () => useContext(RelationshipFocusContext);

export const RelationshipFocusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mainFocusConnection, setMainFocusConnectionObject] = useState<Connection | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Fetch all connections
  const { data: connections = [], isLoading } = useQuery<Connection[]>({
    queryKey: ["/api/connections"],
  });
  
  useEffect(() => {
    if (isLoading) return;
    
    // Try to restore the main focus connection from localStorage
    const savedId = localStorage.getItem('mainFocusConnectionId');
    
    console.log('Focus Context Debug:', {
      savedId,
      connectionsLength: connections?.length || 0,
      connections
    });
    
    if (savedId && connections && connections.length > 0) {
      const savedConnection = connections?.find(c => c.id === parseInt(savedId));
      console.log('Found saved connection:', savedConnection);
      if (savedConnection) {
        setMainFocusConnectionObject(savedConnection);
      }
    }
    
    setLoading(false);
  }, [connections, isLoading]);
  
  const setMainFocusConnection = (connection: Connection | null) => {
    console.log('Context: Setting main focus connection:', connection);
    setMainFocusConnectionObject(connection);
    
    // Store in localStorage for persistence
    if (connection) {
      localStorage.setItem('mainFocusConnectionId', connection.id.toString());
      console.log('Context: Saved to localStorage:', connection.id.toString());
    } else {
      localStorage.removeItem('mainFocusConnectionId');
      console.log('Context: Removed from localStorage');
    }
  };

  return (
    <RelationshipFocusContext.Provider
      value={{
        mainFocusConnection,
        setMainFocusConnection,
        loading,
      }}
    >
      {children}
    </RelationshipFocusContext.Provider>
  );
};