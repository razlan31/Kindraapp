import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { Header } from "@/components/layout/header";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { Connection, relationshipStages } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { useModal } from "@/contexts/modal-context";
import { useRelationshipFocus } from "@/contexts/relationship-focus-context";
import { Input } from "@/components/ui/input";
import { Search, Plus, X, Camera, Heart, Users, Clock, Activity, Calendar, Loader2, Lock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { compressImage } from "@/lib/image-utils";
import { ImagePreviewModal } from "@/components/ui/image-preview-modal";
import { ConnectionDetailedModal } from "@/components/modals/connection-detailed-modal";
import { InlineConnectionModal } from "@/components/modals/inline-connection-modal";
import { SimpleConnectionForm } from "@/components/modals/simple-connection-form";
import { calculateZodiacSign } from "@shared/zodiac-utils";
import { useSubscription } from "@/hooks/use-subscription";

export default function Connections() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedStage, setSelectedStage] = useState<string>("all");
  const [relationshipStage, setRelationshipStage] = useState("Potential");
  const [isCustomStage, setIsCustomStage] = useState(false);
  const [customStageValue, setCustomStageValue] = useState("");
  const [uploadedImage, setUploadedImage] = useState<string>('');
  const [imagePreview, setImagePreview] = useState<{isOpen: boolean, imageUrl: string, name: string}>({
    isOpen: false,
    imageUrl: '',
    name: ''
  });
  const [loadingConnectionId, setLoadingConnectionId] = useState<number | null>(null);
  const [selectedConnection, setSelectedConnection] = useState<Connection | null>(null);
  const [showConnectionDetails, setShowConnectionDetails] = useState(false);
  const { openMomentModal } = useModal();
  
  // Local connection modal state
  const [connectionModalOpen, setConnectionModalOpen] = useState(false);
  const { mainFocusConnection, setMainFocusConnection } = useRelationshipFocus();
  const { toast } = useToast();
  const { subscriptionStatus, isPremium } = useSubscription();

  // Fetch connections and moments
  const { data: connections = [] } = useQuery<Connection[]>({
    queryKey: ['/api/connections'],
  });

  const { data: moments = [] } = useQuery<any[]>({
    queryKey: ['/api/moments'],
  });

  // Get all unique relationship stages from connections (including custom ones)
  const allUniqueStages = connections
    .map(c => c.relationshipStage)
    .filter((stage, index, arr) => arr.indexOf(stage) === index);
  
  // Predefined stage order for common relationship types
  const stageOrder = ["Potential", "Talking", "Situationship", "It's Complicated", "Dating", "Spouse", "FWB", "Ex", "Friend", "Best Friend", "Siblings"];
  
  // Show predefined stages that have connections, followed by custom stages
  const predefinedStages = stageOrder.filter(stage => 
    connections.some(c => c.relationshipStage === stage)
  );
  
  const customStages = allUniqueStages.filter(stage => 
    !stageOrder.includes(stage)
  ).sort(); // Sort custom stages alphabetically
  
  const availableStages = [...predefinedStages, ...customStages];

  // Simple connection filtering and processing
  const displayConnections = connections
    .filter(connection => {
      const matchesSearch = connection.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStage = selectedStage === "all" || 
                          (selectedStage === "main-focus" ? mainFocusConnection?.id === connection.id :
                          connection.relationshipStage === selectedStage);
      return matchesSearch && matchesStage;
    })
    .map(connection => {
      const connectionMoments = moments.filter((m: any) => m.connectionId === connection.id);
      const lastActivity = connectionMoments.length > 0 
        ? new Date(Math.max(...connectionMoments.map((m: any) => new Date(m.createdAt || Date.now()).getTime())))
        : new Date(connection.createdAt || Date.now());
      
      const daysSinceActivity = Math.floor((Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
      const activityCount = connectionMoments.length;
      
      return { ...connection, daysSinceActivity, activityCount };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  // Handle connection selection for navigation
  const handleSelectConnection = (connection: Connection) => {
    setSelectedConnection(connection);
    setShowConnectionDetails(true);
  };

  // Get recent emojis for a connection
  const getConnectionEmojis = (connectionId: number) => {
    const connectionMoments = moments
      .filter((m: any) => m.connectionId === connectionId)
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3);
    
    return connectionMoments.map((m: any) => m.emoji).join(' ');
  };

  // Get flag counts for a connection
  const getFlagCounts = (connectionId: number) => {
    const connectionMoments = moments.filter((m: any) => m.connectionId === connectionId);
    const greenFlags = connectionMoments.filter((m: any) => 
      m.tags && m.tags.some((tag: string) => tag.toLowerCase().includes('green'))
    ).length;
    const redFlags = connectionMoments.filter((m: any) => 
      m.tags && m.tags.some((tag: string) => tag.toLowerCase().includes('red'))
    ).length;
    
    return { greenFlags, redFlags };
  };

  // Create connection mutation
  const { mutate: createConnection, isPending } = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/connections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw result;
      }
      
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/connections'] });
      queryClient.invalidateQueries({ queryKey: ['/api/subscription/status'] });
      setShowAddModal(false);
      setUploadedImage(''); // Reset uploaded image
      toast({
        title: "Connection created",
        description: "New connection has been added successfully.",
      });
    },
    onError: (error: any) => {
      console.error('Connection creation error:', error);
      
      // Handle specific limit reached error
      if (error?.message?.includes('limit reached') || error?.requiresUpgrade || error?.upgradeRequired) {
        toast({
          title: "Connection Limit Reached",
          description: "You've reached your free plan limit. Upgrade to Premium for unlimited connections.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error", 
          description: error?.message || "Failed to create connection. Please try again.",
          variant: "destructive",
        });
      }
    },
  });

  const handleAddConnection = async (formData: FormData) => {
    // Collect multiple love languages
    const loveLanguages = formData.getAll('loveLanguages') as string[];
    
    // Handle custom relationship stage
    const relationshipStageValue = formData.get('relationshipStage') as string;
    console.log("Form submission - relationshipStage from form:", relationshipStageValue);
    console.log("Form submission - isCustomStage:", isCustomStage);
    console.log("Form submission - customStageValue:", customStageValue);
    
    const finalRelationshipStage = isCustomStage && customStageValue.trim() 
      ? customStageValue.trim() 
      : relationshipStageValue;
    
    console.log("Form submission - final relationshipStage:", finalRelationshipStage);
    
    const data = {
      name: formData.get('name') as string,
      relationshipStage: finalRelationshipStage,
      startDate: formData.get('startDate') ? new Date(formData.get('startDate') as string) : null,
      birthday: formData.get('birthday') ? new Date(formData.get('birthday') as string) : null,
      zodiacSign: formData.get('zodiacSign') as string || null,
      loveLanguage: loveLanguages.length > 0 ? loveLanguages.join(', ') : null,
      profileImage: uploadedImage || null,
      isPrivate: formData.get('isPrivate') === 'on',
    };

    console.log("Final form data being sent:", data);
    try {
      await new Promise<void>((resolve, reject) => {
        createConnection(data, {
          onSuccess: () => resolve(),
          onError: (error) => reject(error)
        });
      });
    } catch (error) {
      // Error is already handled by the mutation's onError
      console.error('Connection creation failed:', error);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white dark:bg-neutral-900 min-h-screen flex flex-col relative">
      <Header />

      <main className="flex-1 overflow-y-auto pb-20">
        {/* Header */}
        <section className="px-4 pt-4 pb-2 border-b border-border/40 bg-card/30 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Connections</h1>
              <p className="text-sm text-muted-foreground">
                {connections.length} people in your network
              </p>
            </div>
            <Users className="h-8 w-8 text-primary" />
          </div>
          

        </section>

        {/* Controls Section */}
        <section className="px-4 pt-2 pb-2 sticky top-0 bg-white dark:bg-neutral-900 z-10">
          {/* Horizontal Stage Bubbles */}
          <div className="mb-3">
            <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide">
              <button
                onClick={() => setSelectedStage("all")}
                className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedStage === "all"
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                All ({connections.length})
              </button>
              <button
                onClick={() => setSelectedStage("main-focus")}
                className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedStage === "main-focus"
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                Main Focus ({mainFocusConnection ? 1 : 0})
              </button>
              {availableStages.map(stage => {
                const count = connections.filter(c => c.relationshipStage === stage).length;
                return (
                  <button
                    key={stage}
                    onClick={() => setSelectedStage(stage)}
                    className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      selectedStage === stage
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {stage} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search and Add Button - Same Width */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-500" />
              <Input
                placeholder="Search connections..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12"
              />
            </div>
            <Button onClick={() => {
              console.log("🟢 CONNECTIONS-SIMPLE ADD BUTTON CLICKED - Opening inline modal");
              setShowAddModal(true);
            }} className="w-full h-12">
              <Plus className="h-5 w-5 mr-2" />
              Add Connection
            </Button>
            
            {/* Soft-lock notice for free users with locked connections */}
            {connections.some((conn: any) => conn.isLocked) && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-blue-700 dark:text-blue-200">
                      <strong>Free Plan:</strong> Some connections are locked.
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                      Upgrade to Premium to access all connections.
                    </p>
                  </div>
                  <Button 
                    size="sm" 
                    className="ml-3 bg-blue-600 hover:bg-blue-700 text-white shrink-0"
                    onClick={() => window.location.href = '/settings'}
                  >
                    Upgrade
                  </Button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Connections List */}
        <section className="px-4 pb-4">
          <div className="space-y-3">
            {displayConnections.map((connection: any) => {
              const emojis = getConnectionEmojis(connection.id);
              const { greenFlags, redFlags } = getFlagCounts(connection.id);
              const isMainFocus = mainFocusConnection?.id === connection.id;

              return (
                <ConnectionCard
                  key={connection.id}
                  connection={connection}
                  emojis={emojis}
                  greenFlags={greenFlags}
                  redFlags={redFlags}
                  isMainFocus={isMainFocus}
                  onSelect={handleSelectConnection}
                  onToggleFocus={() => {
                    if (isMainFocus) {
                      setMainFocusConnection(null);
                    } else {
                      setMainFocusConnection(connection);
                    }
                  }}
                  daysSinceActivity={connection.daysSinceActivity}
                  activityCount={connection.activityCount}
                  onImageClick={(imageUrl, name) => {
                    setImagePreview({ isOpen: true, imageUrl, name });
                  }}
                  isLoading={loadingConnectionId === connection.id}
                />
              );
            })}

            {displayConnections.length === 0 && searchTerm && (
              <div className="text-center py-8 text-neutral-500">
                <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No connections found matching "{searchTerm}"</p>
              </div>
            )}

            {connections.length === 0 && (
              <div className="text-center py-8 text-neutral-500">
                <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No connections yet</p>
                <Button onClick={() => setShowAddModal(true)} className="mt-2">
                  Add your first connection
                </Button>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Add Connection Modal - Using SimpleConnectionForm */}
      <SimpleConnectionForm
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddConnection}
        uploadedImage={uploadedImage}
        onImageUpload={async (e) => {
          const file = e.target.files?.[0];
          if (file) {
            try {
              const compressedImage = await compressImage(file);
              setUploadedImage(compressedImage);
            } catch (error) {
              console.error('Error compressing image:', error);
              const reader = new FileReader();
              reader.onload = (event) => {
                const result = event.target?.result as string;
                setUploadedImage(result);
              };
              reader.readAsDataURL(file);
            }
          }
        }}

      />

      {/* Image Preview Modal */}
      <ImagePreviewModal
        isOpen={imagePreview.isOpen}
        onClose={() => setImagePreview({ isOpen: false, imageUrl: '', name: '' })}
        imageUrl={imagePreview.imageUrl}
        name={imagePreview.name}
      />

      {/* Connection Details Modal */}
      <ConnectionDetailedModal
        isOpen={showConnectionDetails}
        onClose={() => setShowConnectionDetails(false)}
        connection={selectedConnection}
      />

      <BottomNavigation />
    </div>
  );
}

// Connection Card Component
interface ConnectionCardProps {
  connection: any;
  emojis: string;
  greenFlags: number;
  redFlags: number;
  isMainFocus: boolean;
  onSelect: (connection: Connection) => void;
  onToggleFocus: () => void;
  daysSinceActivity: number;
  activityCount: number;
  onImageClick?: (imageUrl: string, name: string) => void;
  isLoading?: boolean;
}

function ConnectionCard({ 
  connection, 
  emojis, 
  greenFlags, 
  redFlags, 
  isMainFocus, 
  onSelect, 
  onToggleFocus,
  daysSinceActivity,
  activityCount,
  onImageClick,
  isLoading = false
}: ConnectionCardProps) {
  // Calculate relationship insights
  const getRelationshipInsight = () => {
    if (daysSinceActivity === 0) return { text: "Active today", color: "text-green-600" };
    if (daysSinceActivity <= 3) return { text: "Recently active", color: "text-green-500" };
    if (daysSinceActivity <= 7) return { text: "Needs attention", color: "text-yellow-600" };
    if (daysSinceActivity <= 14) return { text: "Low contact", color: "text-orange-500" };
    return { text: "Distant", color: "text-red-500" };
  };

  const getConnectionStrength = () => {
    if (activityCount >= 10) return { level: "Strong", color: "bg-green-100 text-green-800" };
    if (activityCount >= 5) return { level: "Growing", color: "bg-blue-100 text-blue-800" };
    if (activityCount >= 2) return { level: "New", color: "bg-purple-100 text-purple-800" };
    return { level: "Building", color: "bg-gray-100 text-gray-800" };
  };

  const insight = getRelationshipInsight();
  const strength = getConnectionStrength();

  return (
    <Card 
      className={`p-4 transition-all ${
        connection.isLocked 
          ? 'opacity-60 cursor-not-allowed bg-gray-50 border-gray-200' 
          : 'cursor-pointer hover:shadow-md'
      } ${
        isMainFocus ? 'ring-2 ring-primary bg-primary/5' : ''
      } ${isLoading ? 'opacity-70 pointer-events-none' : ''}`}
      onClick={() => !isLoading && !connection.isLocked && onSelect(connection)}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          {/* Profile Image or Initial */}
          <div className="relative">
            {connection.profileImage ? (
              <img 
                src={connection.profileImage} 
                alt={connection.name}
                className="w-12 h-12 rounded-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  onImageClick?.(connection.profileImage, connection.name);
                }}
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-lg font-medium text-primary">
                  {connection.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            {isMainFocus && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                <Heart className="h-3 w-3 text-white fill-current" />
              </div>
            )}
          </div>

          {/* Connection Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium text-foreground truncate">{connection.name}</h3>
              {connection.isLocked && (
                <Lock className="h-4 w-4 text-gray-500" />
              )}
              <span className="text-xs px-2 py-1 bg-muted rounded-full text-muted-foreground">
                {connection.relationshipStage}
              </span>
            </div>
            
            {/* Insights Row */}
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs px-2 py-1 rounded ${strength.color}`}>
                {strength.level}
              </span>
              <span className={`text-xs ${insight.color}`}>
                {insight.text}
              </span>
            </div>

            {/* Activity and Emojis */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                {emojis && <span className="text-sm">{emojis}</span>}
                {greenFlags > 0 && <span className="text-green-600 text-xs">+{greenFlags}</span>}
                {redFlags > 0 && <span className="text-red-500 text-xs">-{redFlags}</span>}
              </div>
              
              <div className="text-xs text-muted-foreground">
                {activityCount} memories
              </div>
            </div>

            {/* Last Contact */}
            <div className="text-xs text-muted-foreground mt-1">
              Last contact: {daysSinceActivity === 0 ? 'Today' : 
               daysSinceActivity === 1 ? '1 day ago' : 
               daysSinceActivity < 7 ? `${daysSinceActivity} days ago` : 
               daysSinceActivity < 30 ? `${Math.floor(daysSinceActivity / 7)}w ago` : 
               '30+ days ago'}
            </div>
          </div>
        </div>

        {/* Focus Toggle or Loading */}
        {isLoading ? (
          <div className="ml-2 mt-1 p-2">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              !connection.isLocked && onToggleFocus();
            }}
            className="ml-2 mt-1"
            disabled={connection.isLocked}
          >
            <Heart className={`h-4 w-4 ${isMainFocus ? 'fill-current text-primary' : ''}`} />
          </Button>
        )}
      </div>
    </Card>
  );
}

