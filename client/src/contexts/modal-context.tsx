import { createContext, useContext, useState } from "react";
import { Connection } from "@shared/schema";

type ModalContextType = {
  momentModalOpen: boolean;
  connectionModalOpen: boolean;
  moodTrackerModalOpen: boolean;
  selectedConnectionId: number | null;
  selectedConnection: Connection | null;
  mainFocusConnection: Connection | null;
  openMomentModal: () => void;
  closeMomentModal: () => void;
  openConnectionModal: () => void;
  closeConnectionModal: () => void;
  openMoodTrackerModal: (connection?: Connection) => void;
  closeMoodTrackerModal: () => void;
  setSelectedConnection: (connectionId: number | null, connection?: Connection | null) => void;
  setMainFocusConnection: (connection: Connection | null) => void;
};

const ModalContext = createContext<ModalContextType>({
  momentModalOpen: false,
  connectionModalOpen: false,
  moodTrackerModalOpen: false,
  selectedConnectionId: null,
  selectedConnection: null,
  mainFocusConnection: null,
  openMomentModal: () => {},
  closeMomentModal: () => {},
  openConnectionModal: () => {},
  closeConnectionModal: () => {},
  openMoodTrackerModal: () => {},
  closeMoodTrackerModal: () => {},
  setSelectedConnection: () => {},
  setMainFocusConnection: () => {},
});

export const useModal = () => useContext(ModalContext);

export const ModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [momentModalOpen, setMomentModalOpen] = useState(false);
  const [connectionModalOpen, setConnectionModalOpen] = useState(false);
  const [moodTrackerModalOpen, setMoodTrackerModalOpen] = useState(false);
  const [selectedConnectionId, setSelectedConnectionId] = useState<number | null>(null);
  const [selectedConnection, setSelectedConnectionObject] = useState<Connection | null>(null);
  const [mainFocusConnection, setMainFocusConnectionObject] = useState<Connection | null>(null);

  const openMomentModal = () => {
    setMomentModalOpen(true);
  };

  const closeMomentModal = () => {
    setMomentModalOpen(false);
    // Don't reset the selected connection ID here so it can be used when the modal is opened
  };

  const openConnectionModal = () => {
    setConnectionModalOpen(true);
  };

  const closeConnectionModal = () => {
    setConnectionModalOpen(false);
  };

  const openMoodTrackerModal = (connection?: Connection) => {
    if (connection) {
      setSelectedConnectionId(connection.id);
      setSelectedConnectionObject(connection);
    }
    setMoodTrackerModalOpen(true);
  };

  const closeMoodTrackerModal = () => {
    setMoodTrackerModalOpen(false);
  };

  const setSelectedConnection = (connectionId: number | null, connection?: Connection | null) => {
    setSelectedConnectionId(connectionId);
    setSelectedConnectionObject(connection || null);
    // Optionally open the moment modal when a connection is selected
    // if (connectionId !== null) {
    //   openMomentModal();
    // }
  };

  return (
    <ModalContext.Provider
      value={{
        momentModalOpen,
        connectionModalOpen,
        moodTrackerModalOpen,
        selectedConnectionId,
        selectedConnection,
        openMomentModal,
        closeMomentModal,
        openConnectionModal,
        closeConnectionModal,
        openMoodTrackerModal,
        closeMoodTrackerModal,
        setSelectedConnection,
      }}
    >
      {children}
    </ModalContext.Provider>
  );
};
