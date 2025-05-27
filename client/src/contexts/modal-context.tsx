import { createContext, useContext, useState } from "react";
import { Connection, Moment } from "@shared/schema";

type ModalContextType = {
  momentModalOpen: boolean;
  connectionModalOpen: boolean;
  moodTrackerModalOpen: boolean;
  selectedConnectionId: number | null;
  selectedConnection: Connection | null;
  mainFocusConnection: Connection | null;
  activityType: 'moment' | 'conflict' | 'intimacy';
  editingMoment: Moment | null;
  selectedDate: Date | null;
  openMomentModal: (activityType?: 'moment' | 'conflict' | 'intimacy', moment?: Moment, date?: Date) => void;
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
  activityType: 'moment',
  editingMoment: null,
  selectedDate: null,
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
  const [activityType, setActivityType] = useState<'moment' | 'conflict' | 'intimacy'>('moment');
  const [editingMoment, setEditingMoment] = useState<Moment | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const openMomentModal = (activityType: 'moment' | 'conflict' | 'intimacy' = 'moment', moment?: Moment, date?: Date) => {
    console.log("openMomentModal called with:", { activityType, moment: !!moment, date });
    console.log("Date details:", date ? { 
      iso: date.toISOString(), 
      dateString: date.toDateString(),
      valueOf: date.valueOf()
    } : 'No date provided');
    
    setActivityType(activityType);
    setEditingMoment(moment || null);
    setSelectedDate(date || null);
    setMomentModalOpen(true);
    
    console.log("Modal state after setting:", { 
      selectedDate: date || null, 
      momentModalOpen: true 
    });
  };

  const closeMomentModal = () => {
    setMomentModalOpen(false);
    // Reset selected date when closing modal
    setSelectedDate(null);
    // Don't reset the selected connection ID here so it can be used when the modal is opened
  };

  const openConnectionModal = () => {
    console.log("Opening connection modal from context");
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
        mainFocusConnection,
        activityType,
        editingMoment,
        selectedDate,
        openMomentModal,
        closeMomentModal,
        openConnectionModal,
        closeConnectionModal,
        openMoodTrackerModal,
        closeMoodTrackerModal,
        setSelectedConnection,
        setMainFocusConnection: setMainFocusConnectionObject,
      }}
    >
      {children}
    </ModalContext.Provider>
  );
};
