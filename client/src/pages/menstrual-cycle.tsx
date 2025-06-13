import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Calendar, Plus, ChevronLeft, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { MenstrualCycle, Connection } from "@shared/schema";
import { useAuth } from "@/contexts/auth-context";

const symptomsList = [
  "Cramps", "Bloating", "Headache", "Mood swings", "Fatigue", 
  "Breast tenderness", "Acne", "Food cravings", "Back pain", "Nausea"
];

const moodOptions = [
  "Happy", "Sad", "Anxious", "Irritable", "Energetic", "Tired", "Emotional", "Calm"
];

export default function CycleTracker() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCycle, setEditingCycle] = useState<MenstrualCycle | null>(null);
  const [selectedConnectionId, setSelectedConnectionId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

  // Form state
  const [formData, setFormData] = useState({
    startDate: format(new Date(), 'yyyy-MM-dd'),
    periodEndDate: '',
    endDate: '',
    flowIntensity: '',
    mood: '',
    symptoms: [] as string[],
    notes: '',
  });

  // Fetch connections
  const { data: connections = [] } = useQuery<Connection[]>({
    queryKey: ['/api/connections'],
  });

  // Fetch cycles
  const { data: cycles = [], isLoading } = useQuery<MenstrualCycle[]>({
    queryKey: ['/api/menstrual-cycles'],
  });

  // Filter cycles by selected connection
  const filteredCycles = cycles.filter(cycle => {
    if (selectedConnectionId === null) return cycle.connectionId === null; // User's cycles
    return cycle.connectionId === selectedConnectionId;
  });

  // Create cycle mutation
  const createCycleMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/menstrual-cycles', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/menstrual-cycles'] });
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: "Cycle Added",
        description: "Your menstrual cycle has been recorded successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add cycle. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Update cycle mutation
  const updateCycleMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: number } & any) => 
      apiRequest('PATCH', `/api/menstrual-cycles/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/menstrual-cycles'] });
      setIsDialogOpen(false);
      setEditingCycle(null);
      resetForm();
      toast({
        title: "Cycle Updated",
        description: "Your menstrual cycle has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update cycle. Please try again.",
        variant: "destructive",
      });
    }
  });

  const resetForm = () => {
    setFormData({
      startDate: format(new Date(), 'yyyy-MM-dd'),
      periodEndDate: '',
      endDate: '',
      flowIntensity: '',
      mood: '',
      symptoms: [],
      notes: '',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const submitData = {
      startDate: formData.startDate,
      periodEndDate: formData.periodEndDate || null,
      endDate: formData.endDate || null,
      flowIntensity: formData.flowIntensity || null,
      mood: formData.mood || null,
      symptoms: formData.symptoms.length > 0 ? formData.symptoms : null,
      notes: formData.notes || null,
      connectionId: selectedConnectionId,
    };

    if (editingCycle) {
      updateCycleMutation.mutate({ id: editingCycle.id, ...submitData });
    } else {
      createCycleMutation.mutate(submitData);
    }
  };

  const handleEdit = (cycle: MenstrualCycle) => {
    setEditingCycle(cycle);
    setFormData({
      startDate: format(new Date(cycle.startDate), 'yyyy-MM-dd'),
      periodEndDate: cycle.periodEndDate ? format(new Date(cycle.periodEndDate), 'yyyy-MM-dd') : '',
      endDate: cycle.endDate ? format(new Date(cycle.endDate), 'yyyy-MM-dd') : '',
      flowIntensity: cycle.flowIntensity || '',
      mood: cycle.mood || '',
      symptoms: Array.isArray(cycle.symptoms) ? cycle.symptoms : [],
      notes: cycle.notes || '',
    });
    setIsDialogOpen(true);
  };

  const handleSymptomToggle = (symptom: string) => {
    setFormData(prev => ({
      ...prev,
      symptoms: prev.symptoms.includes(symptom)
        ? prev.symptoms.filter(s => s !== symptom)
        : [...prev.symptoms, symptom]
    }));
  };

  const getConnectionName = (connectionId: number | null) => {
    if (connectionId === null) return user?.displayName || user?.username || 'Me';
    const connection = connections.find(c => c.id === connectionId);
    return connection?.name || 'Unknown';
  };

  if (isLoading) {
    return (
      <div className="max-w-md mx-auto bg-white dark:bg-neutral-900 min-h-screen flex flex-col relative">
        <div className="flex items-center p-4 border-b">
          <Button variant="ghost" size="sm" onClick={() => setLocation('/')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </div>
        <main className="flex-1 overflow-y-auto px-4 pt-5">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4"></div>
            <div className="h-64 bg-neutral-200 dark:bg-neutral-700 rounded"></div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white dark:bg-neutral-900 min-h-screen flex flex-col relative">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center">
          <Button variant="ghost" size="sm" onClick={() => setLocation('/')} className="mr-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Cycle Tracker</h1>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Track menstrual cycles and symptoms
            </p>
          </div>
        </div>
        <div className="w-8 h-8 rounded-full border-2 border-pink-500"></div>
      </div>

      <main className="flex-1 overflow-y-auto px-4 pt-6">
        {/* Tracking For Section */}
        <div className="mb-6">
          <Label className="text-sm font-medium mb-2 block">Tracking For:</Label>
          <Select
            value={selectedConnectionId?.toString() || ''}
            onValueChange={(value) => setSelectedConnectionId(value ? parseInt(value) : null)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose connection" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Me</SelectItem>
              {connections.map(connection => (
                <SelectItem key={connection.id} value={connection.id.toString()}>
                  {connection.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* View Mode Toggle */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={viewMode === 'calendar' ? 'default' : 'outline'}
            onClick={() => setViewMode('calendar')}
            className="flex-1"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Calendar
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            onClick={() => setViewMode('list')}
            className="flex-1"
          >
            List View
          </Button>
        </div>

        {/* Cycle History Section */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">Cycle History</CardTitle>
              <Button 
                onClick={() => {
                  setEditingCycle(null);
                  resetForm();
                  setIsDialogOpen(true);
                }} 
                size="sm"
                className="flex items-center gap-1"
              >
                <Plus className="h-4 w-4" />
                Add Cycle
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {filteredCycles.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full border-4 border-neutral-300 mx-auto mb-4"></div>
                <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                  No cycles recorded yet
                </h3>
                <p className="text-neutral-600 dark:text-neutral-400">
                  Start tracking to see your history
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredCycles
                  .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
                  .map(cycle => (
                    <div
                      key={cycle.id}
                      className="p-3 border border-neutral-200 dark:border-neutral-700 rounded-lg cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800"
                      onClick={() => handleEdit(cycle)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">
                            {format(new Date(cycle.startDate), 'MMM d, yyyy')}
                            {cycle.endDate && ` - ${format(new Date(cycle.endDate), 'MMM d')}`}
                          </p>
                          <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            {getConnectionName(cycle.connectionId)}
                          </p>
                          {cycle.mood && (
                            <p className="text-sm text-neutral-600 dark:text-neutral-400">
                              Mood: {cycle.mood}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          {cycle.flowIntensity && (
                            <span className="text-xs bg-pink-100 dark:bg-pink-900 text-pink-700 dark:text-pink-300 px-2 py-1 rounded">
                              {cycle.flowIntensity}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Add/Edit Cycle Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingCycle ? 'Edit Cycle' : 'Add New Cycle'}</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="periodEndDate">Period End Date</Label>
              <Input
                id="periodEndDate"
                type="date"
                value={formData.periodEndDate}
                onChange={(e) => setFormData(prev => ({ ...prev, periodEndDate: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="endDate">Cycle End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="flowIntensity">Flow Intensity</Label>
              <Select
                value={formData.flowIntensity}
                onValueChange={(value) => setFormData(prev => ({ ...prev, flowIntensity: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select intensity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Light">Light</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Heavy">Heavy</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="mood">Mood</Label>
              <Select
                value={formData.mood}
                onValueChange={(value) => setFormData(prev => ({ ...prev, mood: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select mood" />
                </SelectTrigger>
                <SelectContent>
                  {moodOptions.map(mood => (
                    <SelectItem key={mood} value={mood}>{mood}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Symptoms</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {symptomsList.map(symptom => (
                  <div key={symptom} className="flex items-center space-x-2">
                    <Checkbox
                      id={symptom}
                      checked={formData.symptoms.includes(symptom)}
                      onCheckedChange={() => handleSymptomToggle(symptom)}
                    />
                    <Label htmlFor={symptom} className="text-sm">{symptom}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes..."
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                {editingCycle ? 'Update' : 'Add'} Cycle
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}