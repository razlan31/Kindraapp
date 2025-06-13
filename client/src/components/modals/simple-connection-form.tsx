import { useEffect, useState } from "react";
import { X, Camera } from "lucide-react";

interface SimpleConnectionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: FormData) => void;
  uploadedImage: string | null;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  customStageValue: string;
  setCustomStageValue: (value: string) => void;
}

export function SimpleConnectionForm({ 
  isOpen, 
  onClose, 
  onSubmit, 
  uploadedImage,
  onImageUpload,
  customStageValue,
  setCustomStageValue
}: SimpleConnectionFormProps) {
  
  const [selectedStage, setSelectedStage] = useState("Friend");
  const [isCustomStage, setIsCustomStage] = useState(false);
  const [internalCustomValue, setInternalCustomValue] = useState("");

  // Disable body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedStage("Friend");
      setIsCustomStage(false);
      setInternalCustomValue("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Add New Connection</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {/* Form */}
        <form onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          onSubmit(formData);
        }} className="p-4 space-y-4">
          
          {/* Profile Picture */}
          <div className="text-center">
            <label className="block text-sm font-medium mb-3">Profile Picture</label>
            <div className="flex flex-col items-center space-y-3">
              <div className="w-20 h-20 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50">
                {uploadedImage ? (
                  <img src={uploadedImage} alt="Profile preview" className="w-full h-full object-cover rounded-full" />
                ) : (
                  <Camera className="h-8 w-8 text-gray-400" />
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={onImageUpload}
                className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium mb-2">Name*</label>
            <input
              name="name"
              type="text"
              className="w-full p-3 border rounded-lg text-base"
              placeholder="Connection name"
              required
              autoFocus
            />
          </div>

          {/* Relationship Stage */}
          <div>
            <label className="block text-sm font-medium mb-2">Relationship Stage <span className="text-red-500">*</span></label>
            <div className="space-y-2 max-h-40 overflow-y-auto border rounded-lg p-3">
              {[
                "Potential", "Talking", "Situationship", "It's Complicated", 
                "Dating", "Spouse", "FWB", "Ex", "Friend", "Best Friend", "Siblings"
              ].map((stage) => (
                <label key={stage} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="relationshipStage"
                    value={stage}
                    checked={!isCustomStage && selectedStage === stage}
                    onChange={() => {
                      setSelectedStage(stage);
                      setIsCustomStage(false);
                      setInternalCustomValue("");
                    }}
                    className="text-blue-600"
                  />
                  <span className="text-sm">{stage}</span>
                </label>
              ))}
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="relationshipStage"
                  value="Custom"
                  checked={isCustomStage}
                  onChange={() => {
                    setIsCustomStage(true);
                    setSelectedStage("");
                  }}
                  className="text-blue-600"
                />
                <span className="text-sm">Custom Relationship Stage</span>
              </label>
            </div>
            
            {isCustomStage && (
              <div className="mt-3">
                <input
                  name="customStage"
                  type="text"
                  value={internalCustomValue}
                  onChange={(e) => setInternalCustomValue(e.target.value)}
                  placeholder="Enter custom stage (e.g., Mom, Dad, Sister, Colleague)"
                  className="w-full p-3 border rounded-lg text-base"
                />
              </div>
            )}
            
            {!isCustomStage && (
              <input type="hidden" name="relationshipStage" value={selectedStage} />
            )}
            
            <p className="text-xs text-gray-500 mt-1">
              Examples: Mom, Dad, Sister, Colleague, Mentor, etc.
            </p>
          </div>

          {/* Love Languages */}
          <div>
            <label className="block text-sm font-medium mb-2">Love Languages (select all that apply)</label>
            <div className="space-y-2">
              {["Words of Affirmation", "Acts of Service", "Receiving Gifts", "Quality Time", "Physical Touch"].map((language) => (
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
          </div>

          {/* Connection Start Date */}
          <div>
            <label className="block text-sm font-medium mb-2">Connection Start Date</label>
            <input
              name="startDate"
              type="date"
              className="w-full p-3 border rounded-lg text-base"
            />
            <p className="text-xs text-gray-500 mt-1">When did this connection begin?</p>
          </div>

          {/* Birthday */}
          <div>
            <label className="block text-sm font-medium mb-2">Birthday</label>
            <input
              name="birthday"
              type="date"
              className="w-full p-3 border rounded-lg text-base"
            />
            <p className="text-xs text-gray-500 mt-1">Remember important dates</p>
          </div>

          {/* Optional Details Section */}
          <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium">Optional Details</h3>
            
            {/* Zodiac Sign */}
            <div>
              <label className="block text-xs text-gray-500 mb-2">Zodiac Sign</label>
              <select name="zodiacSign" className="w-full p-2 border rounded-md bg-white text-sm">
                <option value="">Select sign or enter birthday above</option>
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
          </div>

          {/* Privacy Option */}
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

          {/* Submit Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 font-medium"
            >
              Add Connection
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-300 py-3 px-4 rounded-lg hover:bg-gray-50 font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}