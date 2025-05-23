import { createContext, useContext, useState, useEffect } from "react";
import { Connection } from "@shared/schema";

type RelationshipFocusContextType = {
  mainFocusConnection: Connection | null;
  setMainFocusConnection: (connection: Connection | null) => void;
};

const RelationshipFocusContext = createContext<RelationshipFocusContextType>({
  mainFocusConnection: null,
  setMainFocusConnection: () => {},
});

export const useRelationshipFocus = () => useContext(RelationshipFocusContext);

export const RelationshipFocusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mainFocusConnection, setMainFocusConnectionObject] = useState<Connection | null>(null);
  
  const setMainFocusConnection = (connection: Connection | null) => {
    setMainFocusConnectionObject(connection);
    
    // Store in localStorage for persistence
    if (connection) {
      localStorage.setItem('mainFocusConnectionId', connection.id.toString());
    } else {
      localStorage.removeItem('mainFocusConnectionId');
    }
  };

  return (
    <RelationshipFocusContext.Provider
      value={{
        mainFocusConnection,
        setMainFocusConnection,
      }}
    >
      {children}
    </RelationshipFocusContext.Provider>
  );
};