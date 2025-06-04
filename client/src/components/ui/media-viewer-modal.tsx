import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight, Download } from "lucide-react";

interface MediaFile {
  id: string;
  type: 'photo' | 'video';
  url: string;
  filename: string;
}

interface MediaViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaFiles: MediaFile[];
  initialIndex?: number;
}

export function MediaViewerModal({ isOpen, onClose, mediaFiles, initialIndex = 0 }: MediaViewerModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  if (!mediaFiles || mediaFiles.length === 0) return null;

  const currentMedia = mediaFiles[currentIndex];
  const hasMultiple = mediaFiles.length > 1;

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? mediaFiles.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === mediaFiles.length - 1 ? 0 : prev + 1));
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = currentMedia.url;
    link.download = currentMedia.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] w-full h-full p-0 bg-black/90 border-0">
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-50 text-white hover:bg-white/20"
            onClick={onClose}
          >
            <X className="h-6 w-6" />
          </Button>

          {/* Download button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-16 z-50 text-white hover:bg-white/20"
            onClick={handleDownload}
          >
            <Download className="h-6 w-6" />
          </Button>

          {/* Navigation buttons */}
          {hasMultiple && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/20"
                onClick={goToPrevious}
              >
                <ChevronLeft className="h-8 w-8" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/20"
                onClick={goToNext}
              >
                <ChevronRight className="h-8 w-8" />
              </Button>
            </>
          )}

          {/* Media content */}
          <div className="w-full h-full flex items-center justify-center p-8">
            {currentMedia.type === 'photo' ? (
              <img
                src={currentMedia.url}
                alt={currentMedia.filename}
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <video
                src={currentMedia.url}
                controls
                className="max-w-full max-h-full"
                autoPlay
              >
                Your browser does not support the video tag.
              </video>
            )}
          </div>

          {/* Media info */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-lg">
            <div className="text-sm font-medium">{currentMedia.filename}</div>
            {hasMultiple && (
              <div className="text-xs text-gray-300 text-center">
                {currentIndex + 1} of {mediaFiles.length}
              </div>
            )}
          </div>

          {/* Thumbnail navigation for multiple files */}
          {hasMultiple && mediaFiles.length > 1 && (
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-2 max-w-sm overflow-x-auto">
              {mediaFiles.map((file, index) => (
                <button
                  key={file.id}
                  onClick={() => setCurrentIndex(index)}
                  className={`flex-shrink-0 w-12 h-12 rounded border-2 overflow-hidden ${
                    index === currentIndex ? 'border-white' : 'border-gray-400'
                  }`}
                >
                  {file.type === 'photo' ? (
                    <img
                      src={file.url}
                      alt={file.filename}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-600 flex items-center justify-center text-white text-xs">
                      🎥
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}