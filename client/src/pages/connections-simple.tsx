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
import { InlineConnectionModal } from "@/components/modals/inline-connection-modal";

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
    const finalRelationshipStage = relationshipStageValue === 'custom' && customStageValue.trim() 
      ? customStageValue.trim() 
      : relationshipStageValue;
    
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
            <Button onClick={() => setShowAddModal(true)} size="sm" className="bg-primary text-white">
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>

          {/* Search and Filter */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search connections..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-white dark:bg-neutral-800"
              />
            </div>

            <div className="flex space-x-2 overflow-x-auto pb-1">
              <Button
                variant={selectedStage === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedStage("all")}
                className="whitespace-nowrap"
              >
                All ({connections.length})
              </Button>
              {mainFocusConnection && (
                <Button
                  variant={selectedStage === "main-focus" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedStage("main-focus")}
                  className="whitespace-nowrap"
                >
                  Main Focus
                </Button>
              )}
              {availableStages.map(stage => {
                const count = connections.filter(c => c.relationshipStage === stage).length;
                return (
                  <Button
                    key={stage}
                    variant={selectedStage === stage ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedStage(stage)}
                    className="whitespace-nowrap"
                  >
                    {stage} ({count})
                  </Button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Connections List */}
        <section className="p-4">
          <div className="space-y-3">
            {displayConnections.map((connection) => {
              const emojis = getConnectionEmojis(connection.id);
              const { greenFlags, redFlags } = getFlagCounts(connection.id);
              
              return (
                <ConnectionCard
                  key={connection.id}
                  connection={connection}
                  emojis={emojis}
                  greenFlags={greenFlags}
                  redFlags={redFlags}
                  onSelect={() => handleSelectConnection(connection)}
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
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
          <div 
            className="bg-white dark:bg-neutral-800 rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto"
            onScroll={() => console.log('Connections modal is scrolling!')}
          >
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
              
              {/* Profile Picture - moved to top with thumbnail */}
              <div>
                <label className="block text-sm font-medium mb-3 text-center">
                  Profile Picture
                </label>
                <div className="flex flex-col items-center space-y-3">
                  <Avatar className="h-24 w-24 border-2 border-blue-100 dark:border-blue-900">
                    {uploadedImage ? (
                      <AvatarImage src={uploadedImage} alt="Profile preview" />
                    ) : (
                      <AvatarFallback className="bg-blue-50 dark:bg-blue-950 text-blue-500">
                        <Camera className="h-8 w-8" />
                      </AvatarFallback>
                    )}
                  </Avatar>
                  
                  <div className="w-full">
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
                      {uploadedImage ? 'Change Photo' : 'Upload Photo'}
                    </Button>
                  </div>
                  
                  {uploadedImage && (
                    <p className="text-xs text-green-600 dark:text-green-400 text-center">
                      Photo uploaded successfully
                    </p>
                  )}
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
                    { value: "custom", label: "Custom Relationship Stage" }
                  ].map((stage) => (
                    <label key={stage.value} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="relationshipStage"
                        value={stage.value}
                        checked={
                          stage.value === "custom" 
                            ? isCustomStage 
                            : !isCustomStage && relationshipStage === stage.value
                        }
                        onChange={() => {
                          if (stage.value === "custom") {
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
                        setCustomStageValue(e.target.value);
                      }}
                      className="w-full"
                    />
                  </div>
                )}
              </div>
              
              {/* When did you start this connection field */}
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
                    <Heart className="h-4 w-4 text-gray-400" />
                  </div>
                  <Input
                    name="birthday"
                    type="date"
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-neutral-500 mt-1">
                  Optional - helps track special moments
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Zodiac Sign
                </label>
                <select name="zodiacSign" className="w-full p-2 border rounded-lg bg-white dark:bg-neutral-700">
                  <option value="">Select zodiac sign</option>
                  <option value="Aries">Aries ♈</option>
                  <option value="Taurus">Taurus ♉</option>
                  <option value="Gemini">Gemini ♊</option>
                  <option value="Cancer">Cancer ♋</option>
                  <option value="Leo">Leo ♌</option>
                  <option value="Virgo">Virgo ♍</option>
                  <option value="Libra">Libra ♎</option>
                  <option value="Scorpio">Scorpio ♏</option>
                  <option value="Sagittarius">Sagittarius ♐</option>
                  <option value="Capricorn">Capricorn ♑</option>
                  <option value="Aquarius">Aquarius ♒</option>
                  <option value="Pisces">Pisces ♓</option>
                </select>
              </div>

              {/* Love Languages - multiple choice */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Love Languages <span className="text-xs text-neutral-500">(Select all that apply)</span>
                </label>
                <div className="space-y-2">
                  {[
                    'Words of Affirmation',
                    'Acts of Service', 
                    'Receiving Gifts',
                    'Quality Time',
                    'Physical Touch'
                  ].map((language) => (
                    <label key={language} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        name="loveLanguages"
                        value={language}
                        className="rounded"
                      />
                      <span className="text-sm">{language}</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-neutral-500 mt-1">
                  Understanding love languages can improve your connection
                </p>
              </div>
              
              <div className="border-t pt-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="isPrivate"
                    id="isPrivate"
                    className="rounded"
                  />
                  <label htmlFor="isPrivate" className="text-sm">
                    Make this connection private
                  </label>
                </div>
                <div className="mt-1">
                  <p className="text-xs text-neutral-500">
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
  onSelect: () => void;
  onImageClick: (imageUrl: string, name: string) => void;
  isLoading: boolean;
}

function ConnectionCard({ connection, emojis, greenFlags, redFlags, onSelect, onImageClick, isLoading }: ConnectionCardProps) {
  return (
    <Card className="p-3 hover:shadow-md transition-all duration-200 border-l-4 border-l-primary/20 cursor-pointer" onClick={onSelect}>
      <div className="flex items-center space-x-3">
        <div className="relative">
          <Avatar 
            className="h-12 w-12 cursor-pointer hover:ring-2 hover:ring-primary transition-all" 
            onClick={(e) => {
              e.stopPropagation();
              if (connection.profileImage) {
                onImageClick(connection.profileImage, connection.name);
              }
            }}
          >
            <AvatarImage src={connection.profileImage || undefined} />
            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-medium">
              {connection.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {isLoading && (
            <div className="absolute inset-0 bg-black/20 rounded-full flex items-center justify-center">
              <Loader2 className="h-4 w-4 animate-spin text-white" />
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-medium text-foreground truncate">{connection.name}</h3>
            <div className="flex items-center space-x-1 text-xs">
              {greenFlags > 0 && (
                <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded">
                  +{greenFlags}
                </span>
              )}
              {redFlags > 0 && (
                <span className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-1.5 py-0.5 rounded">
                  -{redFlags}
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                {connection.relationshipStage}
              </span>
              {emojis && (
                <span className="text-sm">{emojis}</span>
              )}
            </div>
            
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              <Activity className="h-3 w-3" />
              <span>{connection.activityCount}</span>
              {connection.daysSinceActivity > 0 && (
                <>
                  <Clock className="h-3 w-3 ml-1" />
                  <span>{connection.daysSinceActivity}d</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}