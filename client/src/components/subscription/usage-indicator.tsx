import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Crown, AlertTriangle } from "lucide-react";

interface UsageIndicatorProps {
  label: string;
  current: number;
  limit: number | "unlimited";
  isPremium?: boolean;
  showUpgrade?: boolean;
  onUpgrade?: () => void;
}

export function UsageIndicator({ 
  label, 
  current, 
  limit, 
  isPremium = false,
  showUpgrade = false,
  onUpgrade 
}: UsageIndicatorProps) {
  if (limit === "unlimited") {
    return (
      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border">
        <div className="flex items-center gap-2">
          <Crown className="h-4 w-4 text-purple-600" />
          <span className="font-medium">{label}</span>
        </div>
        <Badge variant="secondary" className="bg-purple-100 text-purple-800">
          Unlimited
        </Badge>
      </div>
    );
  }

  const percentage = Math.min((current / limit) * 100, 100);
  const isNearLimit = percentage >= 80;
  const isAtLimit = current >= limit;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isAtLimit && <AlertTriangle className="h-4 w-4 text-orange-500" />}
          <span className="font-medium text-sm">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {current}/{limit}
          </span>
          {isAtLimit && (
            <Badge variant="destructive" className="text-xs">
              Limit Reached
            </Badge>
          )}
          {isNearLimit && !isAtLimit && (
            <Badge variant="outline" className="text-xs border-orange-500 text-orange-600">
              Near Limit
            </Badge>
          )}
        </div>
      </div>
      
      <div className="space-y-1">
        <Progress 
          value={percentage} 
          className={`h-2 ${isAtLimit ? 'bg-orange-100' : isNearLimit ? 'bg-yellow-100' : 'bg-gray-100'}`}
        />
        
        {isAtLimit && showUpgrade && (
          <button
            onClick={onUpgrade}
            className="text-xs text-purple-600 hover:text-purple-800 font-medium"
          >
            Upgrade for unlimited access
          </button>
        )}
      </div>
    </div>
  );
}