import { useEffect } from "react";
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
            <label className="block text-sm font-medium mb-2">Relationship Stage</label>
            <select
              name="relationshipStage"
              className="w-full p-3 border rounded-lg text-base"
              defaultValue="Friend"
              onFocus={(e) => {
                // Prevent the refresh behavior by ensuring the select stays focused
                e.target.style.outline = 'none';
              }}
              onChange={(e) => {
                e.preventDefault();
                if (e.target.value === "Custom") {
                  setCustomStageValue("");
                }
              }}
            >
              <option value="Stranger">Stranger</option>
              <option value="Acquaintance">Acquaintance</option>
              <option value="Friend">Friend</option>
              <option value="Close Friend">Close Friend</option>
              <option value="Best Friend">Best Friend</option>
              <option value="Dating">Dating</option>
              <option value="In a Relationship">In a Relationship</option>
              <option value="Engaged">Engaged</option>
              <option value="Married">Married</option>
              <option value="Family">Family</option>
              <option value="Custom">Custom</option>
            </select>
          </div>

          {/* Custom Stage Input */}
          <div>
            <label className="block text-sm font-medium mb-2">Custom Stage</label>
            <input
              name="customStage"
              type="text"
              value={customStageValue}
              onChange={(e) => setCustomStageValue(e.target.value)}
              className="w-full p-3 border rounded-lg text-base"
              placeholder="Enter custom relationship stage"
            />
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

          {/* Birthday */}
          <div>
            <label className="block text-sm font-medium mb-2">Birthday</label>
            <input
              name="birthday"
              type="date"
              className="w-full p-3 border rounded-lg text-base"
            />
          </div>

          {/* Zodiac Sign */}
          <div>
            <label className="block text-sm font-medium mb-2">Zodiac Sign</label>
            <select name="zodiacSign" className="w-full p-3 border rounded-lg text-base">
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

          {/* Connection Start Date */}
          <div>
            <label className="block text-sm font-medium mb-2">Connection Start Date</label>
            <input
              name="startDate"
              type="date"
              className="w-full p-3 border rounded-lg text-base"
            />
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