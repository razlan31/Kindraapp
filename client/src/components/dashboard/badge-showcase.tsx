import { Badge } from "@shared/schema";

interface BadgeShowcaseProps {
  badges: Badge[];
  earnedBadgeIds: number[];
}

export function BadgeShowcase({ badges, earnedBadgeIds }: BadgeShowcaseProps) {
  const earnedBadges = badges.filter(badge => earnedBadgeIds.includes(badge.id));
  
  if (earnedBadges.length === 0) {
    return (
      <div className="text-center py-6">
        <div className="text-neutral-400 mb-2">🏆</div>
        <p className="text-sm text-neutral-500">No badges earned yet</p>
        <p className="text-xs text-neutral-400">Keep tracking moments to unlock achievements!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-3">
      {earnedBadges.slice(0, 6).map(badge => (
        <div key={badge.id} className="flex flex-col items-center p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
          <div className="text-2xl mb-1">{badge.icon}</div>
          <span className="text-xs font-medium text-center">{badge.name}</span>
          <span className="text-xs text-neutral-500 text-center">{badge.description}</span>
        </div>
      ))}
    </div>
  );
}