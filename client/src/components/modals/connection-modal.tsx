import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ConnectionModal({ isOpen, onClose }: ConnectionModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    relationshipStage: "Dating"
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createConnectionMutation = useMutation({
    mutationFn: async (data: { name: string; relationshipStage: string }) => {
      return await apiRequest("/api/connections", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/connections"] });
      toast({
        title: "Success",
        description: "Connection added successfully!",
      });
      onClose();
      setFormData({ name: "", relationshipStage: "Dating" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add connection",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Please enter a name",
        variant: "destructive",
      });
      return;
    }
    createConnectionMutation.mutate(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 flex items-start justify-center" onClick={onClose}>
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-md mx-4 overflow-y-auto"
        style={{
          marginTop: '20vh',
          maxHeight: 'calc(100vh - 100px)', // Ensure space above bottom nav
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-heading font-semibold text-lg">Add New Connection</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Name
            </label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter name"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="relationshipStage" className="text-sm font-medium">
              Relationship Stage
            </label>
            <select
              id="relationshipStage"
              value={formData.relationshipStage}
              onChange={(e) => setFormData({ ...formData, relationshipStage: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="Dating">Dating</option>
              <option value="Talking">Talking</option>
              <option value="Relationship">Relationship</option>
              <option value="Best Friend">Best Friend</option>
              <option value="Friend">Friend</option>
              <option value="Family">Family</option>
            </select>
          </div>

          <div className="flex justify-between gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={createConnectionMutation.isPending} className="flex-1">
              {createConnectionMutation.isPending ? "Adding..." : "Add Connection"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}