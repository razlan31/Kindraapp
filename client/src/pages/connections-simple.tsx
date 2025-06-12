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
import { Search, Plus, X, Camera, Heart, Users, Clock, Activity, Calendar, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { compressImage } from "@/lib/image-utils";
import { ImagePreviewModal } from "@/components/ui/image-preview-modal";
import { ConnectionDetailedModal } from "@/components/modals/connection-detailed-modal";

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
  const { openMomentModal, openConnectionModal } = useModal();
  const { mainFocusConnection, setMainFocusConnection } = useRelationshipFocus();
  const { toast } = useToast();

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
      
      if (!response.ok) {
        throw new Error('Failed to create connection');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/connections'] });
      setShowAddModal(false);
      setUploadedImage(''); // Reset uploaded image
      toast({
        title: "Connection created",
        description: "New connection has been added successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create connection.",
        variant: "destructive",
      });
    },
  });

  const handleAddConnection = (formData: FormData) => {
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
    createConnection(data);
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

      {/* Add Connection Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="font-heading font-semibold text-lg">Add New Connection</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowAddModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleAddConnection(formData);
            }} className="p-4 space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Profile Image
                </label>
                <div className="mb-4">
                  <div className="flex items-center justify-center mb-3">
                    <Avatar className="h-20 w-20 border-2 border-blue-100 dark:border-blue-900">
                      {uploadedImage ? (
                        <AvatarImage src={uploadedImage} alt="Profile preview" />
                      ) : (
                        <AvatarFallback className="bg-blue-50 dark:bg-blue-950 text-blue-500">
                          <Camera className="h-6 w-6" />
                        </AvatarFallback>
                      )}
                    </Avatar>
                  </div>
                  
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      id="fileUpload"
                      name="profileImageFile"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            const compressedImage = await compressImage(file);
                            setUploadedImage(compressedImage);
                          } catch (error) {
                            console.error('Error compressing image:', error);
                            // Fallback to original file if compression fails
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
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => document.getElementById('fileUpload')?.click()}
                      className="w-full"
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Upload Photo from Device
                    </Button>
                  </div>
                  
                  <p className="text-xs text-neutral-500 mt-1">
                    Choose a photo from your device to personalize this connection
                  </p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Name <span className="text-red-500">*</span>
                </label>
                <Input
                  name="name"
                  required
                  placeholder="Enter name"
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Relationship Stage <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  {[
                    ...relationshipStages.map(stage => ({ value: stage, label: stage })),
                    { value: "Custom", label: "Custom Relationship Stage" }
                  ].map((stage) => (
                    <label key={stage.value} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="relationshipStage"
                        value={stage.value}
                        checked={
                          stage.value === "Custom" 
                            ? isCustomStage 
                            : !isCustomStage && relationshipStage === stage.value
                        }
                        onChange={() => {
                          console.log("Radio selected:", stage.value);
                          if (stage.value === "Custom") {
                            setIsCustomStage(true);
                            setRelationshipStage("");
                          } else {
                            setIsCustomStage(false);
                            setRelationshipStage(stage.value);
                            setCustomStageValue("");
                          }
                        }}
                        className="text-primary"
                      />
                      <span className="text-sm">{stage.label}</span>
                    </label>
                  ))}
                </div>
                
                {isCustomStage && (
                  <div className="mt-3">
                    <Input
                      placeholder="Enter custom relationship stage"
                      value={customStageValue}
                      onChange={(e) => {
                        console.log("Custom dropdown changed to:", e.target.value);
                        setCustomStageValue(e.target.value);
                      }}
                      className="w-full"
                    />
                    <input type="hidden" name="relationshipStage" value={customStageValue} />
                  </div>
                )}
                
                {!isCustomStage && (
                  <input type="hidden" name="relationshipStage" value={relationshipStage} />
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  When did you start this connection?
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Calendar className="h-4 w-4 text-gray-400" />
                  </div>
                  <Input
                    name="startDate"
                    type="date"
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-neutral-500 mt-1">
                  Track when you first connected with this person
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Birthday
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Calendar className="h-4 w-4 text-gray-400" />
                  </div>
                  <Input
                    name="birthday"
                    type="date"
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-neutral-500 mt-1">
                  Remember important dates
                </p>
              </div>
              
              <div className="space-y-3 bg-neutral-50 dark:bg-neutral-900 p-4 rounded-lg">
                <h3 className="text-sm font-medium">Optional Details</h3>
                
                <div className="space-y-2">
                  <label className="block text-xs text-neutral-500">Zodiac Sign</label>
                  <select name="zodiacSign" className="w-full p-2 border rounded-md bg-background text-sm">
                    <option value="">Select sign</option>
                    <option value="Aries">Aries</option>
                    <option value="Taurus">Taurus</option>
                    <option value="Gemini">Gemini</option>
                    <option value="Cancer">Cancer</option>
                    <option value="Leo">Leo</option>
                    <option value="Virgo">Virgo</option>
                    <option value="Libra">Libra</option>
                    <option value="Scorpio">Scorpio</option>
                    <option value="Sagittarius">Sagittarius</option>
                    <option value="Capricorn">Capricorn</option>
                    <option value="Aquarius">Aquarius</option>
                    <option value="Pisces">Pisces</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-xs text-neutral-500">Love Languages</label>
                  <div className="space-y-2">
                    {["Words of Affirmation", "Quality Time", "Physical Touch", "Acts of Service", "Receiving Gifts"].map((language) => (
                      <div key={language} className="flex items-center space-x-2">
                        <input 
                          type="checkbox" 
                          name="loveLanguages" 
                          value={language}
                          id={`love-${language.replace(/\s+/g, '-').toLowerCase()}`}
                          className="rounded"
                        />
                        <label 
                          htmlFor={`love-${language.replace(/\s+/g, '-').toLowerCase()}`}
                          className="text-sm"
                        >
                          {language}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 space-y-0 rounded-md border p-4">
                <input 
                  type="checkbox" 
                  name="isPrivate" 
                  id="private"
                  className="mt-1"
                />
                <div className="space-y-1 leading-none">
                  <label htmlFor="private" className="text-sm font-medium">Keep this connection private</label>
                  <p className="text-sm text-gray-500">
                    Private connections are only visible to you
                  </p>
                </div>
              </div>
              
              <div className="pt-2">
                <Button type="submit" className="w-full bg-primary text-white" disabled={isPending}>
                  {isPending ? "Adding..." : "Add Connection"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

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
      className={`p-4 cursor-pointer transition-all hover:shadow-md ${
        isMainFocus ? 'ring-2 ring-primary bg-primary/5' : ''
      } ${isLoading ? 'opacity-70 pointer-events-none' : ''}`}
      onClick={() => !isLoading && onSelect(connection)}
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
              onToggleFocus();
            }}
            className="ml-2 mt-1"
          >
            <Heart className={`h-4 w-4 ${isMainFocus ? 'fill-current text-primary' : ''}`} />
          </Button>
        )}
      </div>
    </Card>
  );
}

