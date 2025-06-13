import { useState } from "react";
import { X, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface SimpleConnectionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: FormData) => Promise<void>;
  uploadedImage: string | null;
  onImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  customStageValue: string;
  setCustomStageValue: (value: string) => void;
}

const defaultRelationshipStages = [
  "Potential", "Talking", "Situationship", "It's Complicated", 
  "Dating", "Spouse", "FWB", "Ex", "Friend", "Best Friend", "Siblings"
];

export function SimpleConnectionForm({ 
  isOpen, 
  onClose, 
  onSubmit,
  uploadedImage,
  onImageUpload
}: SimpleConnectionFormProps) {

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    // Handle image upload
    if (uploadedImage) {
      formData.set('profileImage', uploadedImage);
    }
    
    onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4 pb-24">
      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-lg w-full max-w-md max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-heading font-semibold text-lg">Add New Connection</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {/* Image Upload Section - First */}
            <div className="flex flex-col items-center space-y-3">
              <div className="relative">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={uploadedImage || undefined} />
                  <AvatarFallback className="text-lg">
                    <Camera className="h-8 w-8 text-muted-foreground" />
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="space-y-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={onImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm text-sm font-medium bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Upload Photo from Device
                </label>
                {uploadedImage && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const event = { target: { files: null } } as any;
                      onImageUpload(event);
                    }}
                    className="w-full"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Remove Photo
                  </Button>
                )}
              </div>
            </div>

            {/* Name Field - Second */}
            <div>
              <label className="block text-sm font-medium mb-2">Name *</label>
              <Input
                name="name"
                required
                placeholder="Enter name"
                className="w-full"
              />
            </div>

            {/* Relationship Stage Dropdown - Third */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Relationship Stage
              </label>
              <select
                name="relationshipStage"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-background"
                defaultValue="Dating"
              >
                {defaultRelationshipStages.map((stage) => (
                  <option key={stage} value={stage}>{stage}</option>
                ))}
              </select>
            </div>

            {/* Start Date - Fourth */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Start Date
              </label>
              <Input
                type="date"
                name="startDate"
                className="w-full"
              />
            </div>

            {/* Birthday - Fifth */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Birthday
              </label>
              <Input
                type="date"
                name="birthday"
                className="w-full"
              />
            </div>

            {/* Zodiac Sign - Sixth */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Zodiac Sign
              </label>
              <select
                name="zodiacSign"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-background"
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

            {/* Love Languages - Seventh */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Love Languages
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input type="checkbox" name="loveLanguage" value="Words of Affirmation" className="mr-2" />
                  <span className="text-sm">Words of Affirmation</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" name="loveLanguage" value="Quality Time" className="mr-2" />
                  <span className="text-sm">Quality Time</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" name="loveLanguage" value="Physical Touch" className="mr-2" />
                  <span className="text-sm">Physical Touch</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" name="loveLanguage" value="Acts of Service" className="mr-2" />
                  <span className="text-sm">Acts of Service</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" name="loveLanguage" value="Receiving Gifts" className="mr-2" />
                  <span className="text-sm">Receiving Gifts</span>
                </label>
              </div>
            </div>

            {/* Privacy Setting - Eighth */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="isPrivate"
                id="isPrivate"
                className="rounded"
              />
              <label htmlFor="isPrivate" className="text-sm">
                Keep this connection private
              </label>
            </div>
          </div>

          <div className="flex justify-between gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1"
            >
              Add Connection
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}