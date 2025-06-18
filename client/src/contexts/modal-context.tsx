import { createContext, useContext, useState } from "react";
import { Connection, Moment } from "@shared/schema";

type ModalContextType = {
  momentModalOpen: boolean;
  moodTrackerModalOpen: boolean;
  planModalOpen: boolean;
  selectedConnectionId: number | null;
  selectedConnection: Connection | null;
  mainFocusConnection: Connection | null;
  activityType: 'moment' | 'conflict' | 'intimacy' | 'plan';
  editingMoment: Moment | null;
  selectedDate: Date | null;
  navigationConnectionId: number | null;
  openMomentModal: (activityType?: 'moment' | 'conflict' | 'intimacy' | 'plan', moment?: Moment, date?: Date) => void;
  closeMomentModal: () => void;

  openMoodTrackerModal: (connection?: Connection) => void;
  closeMoodTrackerModal: () => void;
  openPlanModal: (connection?: Connection, date?: Date) => void;
  closePlanModal: () => void;
  setSelectedConnection: (connectionId: number | null, connection?: Connection | null) => void;
  setMainFocusConnection: (connection: Connection | null) => void;
  setNavigationConnectionId: (connectionId: number | null) => void;
  onConnectionChanged?: (connectionId: number | null) => void;
  registerConnectionChangeListener: (callback: (connectionId: number | null) => void) => void;
};

const ModalContext = createContext<ModalContextType>({
  momentModalOpen: false,
  moodTrackerModalOpen: false,
  planModalOpen: false,
  selectedConnectionId: null,
  selectedConnection: null,
  mainFocusConnection: null,
  activityType: 'moment',
  editingMoment: null,
  selectedDate: null,
  navigationConnectionId: null,
  openMomentModal: () => {},
  closeMomentModal: () => {},
  openMoodTrackerModal: () => {},
  closeMoodTrackerModal: () => {},
  openPlanModal: () => {},
  closePlanModal: () => {},
  setSelectedConnection: () => {},
  setMainFocusConnection: () => {},
  setNavigationConnectionId: () => {},
  onConnectionChanged: undefined,
  registerConnectionChangeListener: () => {},
});

export const useModal = () => useContext(ModalContext);

export const ModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [momentModalOpen, setMomentModalOpen] = useState(false);

  const [moodTrackerModalOpen, setMoodTrackerModalOpen] = useState(false);
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [selectedConnectionId, setSelectedConnectionId] = useState<number | null>(null);
  const [selectedConnection, setSelectedConnectionObject] = useState<Connection | null>(null);
  const [mainFocusConnection, setMainFocusConnectionObject] = useState<Connection | null>(null);
  const [activityType, setActivityType] = useState<'moment' | 'conflict' | 'intimacy' | 'plan'>('moment');
  const [editingMoment, setEditingMoment] = useState<Moment | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [navigationConnectionId, setNavigationConnectionId] = useState<number | null>(null);
  const [connectionChangeListener, setConnectionChangeListener] = useState<((connectionId: number | null) => void) | undefined>(undefined);

  const openMomentModal = (activityType: 'moment' | 'conflict' | 'intimacy' | 'plan' = 'moment', moment?: Moment, date?: Date) => {
    console.log("openMomentModal called with:", { activityType, moment: !!moment, date });
    console.log("Date details:", date ? { 
      iso: date.toISOString(), 
      dateString: date.toDateString(),
      valueOf: date.valueOf()
    } : 'No date provided');
    
    if (activityType === 'plan') {
      // For plans, open the plan modal instead
      setEditingMoment(moment || null);
      setSelectedDate(date || null);
      setPlanModalOpen(true);
    } else {
      setActivityType(activityType);
      setEditingMoment(moment || null);
      setSelectedDate(date || null);
      console.log("Setting momentModalOpen to true");
      setMomentModalOpen(true);
    }
    
    console.log("Modal state after setting:", { 
      selectedDate: date || null, 
      modalOpen: activityType === 'plan' ? 'plan' : 'moment'
    });
  };

  const closeMomentModal = () => {
    setMomentModalOpen(false);
    // Reset selected date when closing modal
    setSelectedDate(null);
    // Don't reset the selected connection ID here so it can be used when the modal is opened
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

  const openPlanModal = (connection?: Connection, date?: Date) => {
    console.log("🔥 PLAN MODAL - openPlanModal called with:", { connection: connection?.name, date });
    if (connection) {
      setSelectedConnectionObject(connection);
      setSelectedConnectionId(connection.id);
      console.log("🔥 PLAN MODAL - Set connection:", connection.name);
    }
    if (date) {
      setSelectedDate(date);
      console.log("🔥 PLAN MODAL - Set date:", date);
    }
    console.log("🔥 PLAN MODAL - Setting planModalOpen to true");
    setPlanModalOpen(true);
  };

  const closePlanModal = () => {
    setPlanModalOpen(false);
  };

  const setSelectedConnection = (connectionId: number | null, connection?: Connection | null) => {
    console.log("Modal context setSelectedConnection called:", { connectionId, connection: connection?.name });
    setSelectedConnectionId(connectionId);
    setSelectedConnectionObject(connection || null);
    
    // Notify the activity page about connection change
    if (connectionChangeListener) {
      console.log("Calling connection change listener with:", connectionId);
      connectionChangeListener(connectionId);
    } else {
      console.log("No connection change listener registered");
    }
  };

  const registerConnectionChangeListener = (callback: (connectionId: number | null) => void) => {
    setConnectionChangeListener(() => callback);
  };

  return (
    <ModalContext.Provider
      value={{
        momentModalOpen,
        moodTrackerModalOpen,
        planModalOpen,
        selectedConnectionId,
        selectedConnection,
        mainFocusConnection,
        activityType,
        editingMoment,
        selectedDate,
        navigationConnectionId,
        openMomentModal,
        closeMomentModal,
        openMoodTrackerModal,
        closeMoodTrackerModal,
        openPlanModal,
        closePlanModal,
        setSelectedConnection,
        setMainFocusConnection: setMainFocusConnectionObject,
        setNavigationConnectionId,
        onConnectionChanged: connectionChangeListener,
        registerConnectionChangeListener,
      }}
    >
      {children}
    </ModalContext.Provider>
  );
};
