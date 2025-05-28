import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  name: string;
}

export function ImagePreviewModal({ isOpen, onClose, imageUrl, name }: ImagePreviewModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 bg-black/90 border-none">
        <DialogHeader className="absolute top-2 right-2 z-10">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 text-white hover:bg-white/20"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        
        <div className="relative aspect-square">
          <img 
            src={imageUrl} 
            alt={`${name}'s profile`}
            className="w-full h-full object-cover rounded-lg"
          />
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <DialogTitle className="text-white text-lg font-medium">
            {name}
          </DialogTitle>
        </div>
      </DialogContent>
    </Dialog>
  );
}