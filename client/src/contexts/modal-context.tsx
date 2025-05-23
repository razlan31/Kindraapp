import { createContext, useContext, useState } from "react";

type ModalContextType = {
  momentModalOpen: boolean;
  connectionModalOpen: boolean;
  selectedConnectionId: number | null;
  openMomentModal: () => void;
  closeMomentModal: () => void;
  openConnectionModal: () => void;
  closeConnectionModal: () => void;
  setSelectedConnection: (connectionId: number | null) => void;
};

const ModalContext = createContext<ModalContextType>({
  momentModalOpen: false,
  connectionModalOpen: false,
  selectedConnectionId: null,
  openMomentModal: () => {},
  closeMomentModal: () => {},
  openConnectionModal: () => {},
  closeConnectionModal: () => {},
  setSelectedConnection: () => {},
});

export const useModal = () => useContext(ModalContext);

export const ModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [momentModalOpen, setMomentModalOpen] = useState(false);
  const [connectionModalOpen, setConnectionModalOpen] = useState(false);
  const [selectedConnectionId, setSelectedConnectionId] = useState<number | null>(null);

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

  const setSelectedConnection = (connectionId: number | null) => {
    setSelectedConnectionId(connectionId);
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
        selectedConnectionId,
        openMomentModal,
        closeMomentModal,
        openConnectionModal,
        closeConnectionModal,
        setSelectedConnection,
      }}
    >
      {children}
    </ModalContext.Provider>
  );
};
