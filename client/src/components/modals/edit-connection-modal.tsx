import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Camera, Save, X } from 'lucide-react';
import { format } from 'date-fns';
import { useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { Connection } from '@shared/schema';

interface EditConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  connection: Connection | null;
}

export function EditConnectionModal({ isOpen, onClose, connection }: EditConnectionModalProps) {
  const [editData, setEditData] = useState<Partial<Connection>>(connection || {});
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const { toast } = useToast();

  // Update connection mutation
  const updateConnection = useMutation({
    mutationFn: async (data: Partial<Connection>) => {
      if (!connection) throw new Error('No connection');
      const response = await fetch(`/api/connections/${connection.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Failed to update connection');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/connections'] });
      toast({ title: 'Connection updated successfully!' });
      onClose();
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error updating connection', 
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const handleSave = () => {
    let finalData = { ...editData };
    
    // If there's a preview image, use it as the profile image
    if (previewImage) {
      finalData.profileImage = previewImage;
    }
    
    updateConnection.mutate(finalData);
  };

  const handleEditChange = (field: keyof Connection, value: any) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImageFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setPreviewImage(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setProfileImageFile(null);
    setPreviewImage(null);
    setEditData(prev => ({ ...prev, profileImage: null }));
  };

  if (!connection) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>Edit Connection</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Profile Picture Section */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Camera className="h-4 w-4" />
              Profile Picture
            </h3>
            <div className="flex items-center gap-4">
              <div className="relative">
                {previewImage || connection.profileImage ? (
                  <img 
                    src={previewImage || connection.profileImage || ''}
                    alt={connection.name}
                    className="w-20 h-20 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-primary font-semibold text-2xl">
                      {connection.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="profile-image" className="cursor-pointer">
                  <Button type="button" variant="outline" size="sm" asChild>
                    <span>
                      <Camera className="h-4 w-4 mr-2" />
                      Change Photo
                    </span>
                  </Button>
                </Label>
                <input
                  id="profile-image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                {(previewImage || connection.profileImage) && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={handleRemoveImage}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Remove Photo
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {/* Basic Information */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Basic Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={editData.name || ''}
                  onChange={(e) => handleEditChange('name', e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="relationshipStage">Relationship Stage</Label>
                <Input
                  id="relationshipStage"
                  value={editData.relationshipStage || ''}
                  onChange={(e) => handleEditChange('relationshipStage', e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={editData.startDate ? format(new Date(editData.startDate), 'yyyy-MM-dd') : ''}
                  onChange={(e) => handleEditChange('startDate', new Date(e.target.value))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="birthday">Birthday</Label>
                <Input
                  id="birthday"
                  type="date"
                  value={editData.birthday ? format(new Date(editData.birthday), 'yyyy-MM-dd') : ''}
                  onChange={(e) => handleEditChange('birthday', new Date(e.target.value))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="zodiacSign">Zodiac Sign</Label>
                <select
                  id="zodiacSign"
                  value={editData.zodiacSign || ''}
                  onChange={(e) => handleEditChange('zodiacSign', e.target.value)}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Select zodiac sign</option>
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
              <div>
                <Label htmlFor="loveLanguages">Love Languages</Label>
                <div className="mt-2 space-y-2">
                  {["Words of Affirmation", "Quality Time", "Physical Touch", "Acts of Service", "Receiving Gifts"].map((language) => {
                    const currentLanguages = editData.loveLanguage ? editData.loveLanguage.split(', ') : [];
                    const isSelected = currentLanguages.includes(language);
                    
                    return (
                      <div key={language} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`love-${language.replace(/\s+/g, '-').toLowerCase()}`}
                          checked={isSelected}
                          onChange={(e) => {
                            let newLanguages = [...currentLanguages];
                            if (e.target.checked) {
                              if (!newLanguages.includes(language)) {
                                newLanguages.push(language);
                              }
                            } else {
                              newLanguages = newLanguages.filter(l => l !== language);
                            }
                            handleEditChange('loveLanguage', newLanguages.join(', '));
                          }}
                          className="rounded"
                        />
                        <Label
                          htmlFor={`love-${language.replace(/\s+/g, '-').toLowerCase()}`}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {language}
                        </Label>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </Card>

          <Separator />

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={updateConnection.isPending}
              className="min-w-24"
            >
              {updateConnection.isPending ? (
                'Saving...'
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}