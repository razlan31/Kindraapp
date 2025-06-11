import { useState, useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { relationshipStages } from "@shared/schema";

interface ConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ConnectionModal({ isOpen, onClose }: ConnectionModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    relationshipStage: "Dating"
  });
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [customStage, setCustomStage] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }

    if (showSuggestions) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showSuggestions]);

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
            <div className="relative" ref={dropdownRef}>
              <Input
                id="relationshipStage"
                value={formData.relationshipStage}
                onChange={(e) => {
                  setFormData({ ...formData, relationshipStage: e.target.value });
                  setCustomStage(e.target.value);
                }}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Type custom stage or select from suggestions"
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                onClick={() => setShowSuggestions(!showSuggestions)}
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
              
              {showSuggestions && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-48 overflow-y-auto">
                  {relationshipStages.map((stage) => (
                    <button
                      key={stage}
                      type="button"
                      className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 text-sm"
                      onClick={() => {
                        setFormData({ ...formData, relationshipStage: stage });
                        setCustomStage(stage);
                        setShowSuggestions(false);
                      }}
                    >
                      {stage}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500">
              Examples: Mom, Dad, Sister, Colleague, Mentor, etc.
            </p>
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