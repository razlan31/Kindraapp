import { useModal } from "@/contexts/modal-context";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import MomentModal from "./simplified-moment-modal";
import MoodTrackerModal from "./mood-tracker-modal";
import PlanModal from "./plan-modal";

export default function ModalsContainer() {
  const { user } = useAuth();
  const {
    momentModalOpen,
    moodTrackerModalOpen,
    planModalOpen,
    selectedConnection,
    closeMomentModal,
    closeMoodTrackerModal,
    closePlanModal,
  } = useModal();

  // Fetch connections for modal use
  const { data: connections = [] } = useQuery({
    queryKey: ["/api/connections"],
    enabled: !!user,
  });

  return (
    <>
      {/* Moment Modal */}
      <MomentModal
        isOpen={momentModalOpen}
        onClose={closeMomentModal}
      />

      {/* Mood Tracker Modal */}
      <MoodTrackerModal
        isOpen={moodTrackerModalOpen}
        onClose={closeMoodTrackerModal}
        connection={selectedConnection}
      />

      {/* Plan Modal */}
      <PlanModal
        isOpen={planModalOpen}
        onClose={closePlanModal}
        selectedConnection={selectedConnection}
        selectedDate={null}
        showConnectionPicker={true}
        editingMoment={null}
      />
    </>
  );
}