'use client'
import { FC } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";

type BadgeType = {
  id: string;
  name: string;
  color: string;
};

type BadgesNavProps = {
  badges: BadgeType[];
};

const BadgesNav: FC<BadgesNavProps> = ({ badges }) => {
  const router = useRouter();

  const handleBadgeClick = (badgeName: string) => {
    router.push(`/tag/${badgeName}`);
  };

  return (
    <div className="flex flex-wrap gap-2 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
      {badges.map((badge) => (
        <Badge
          key={badge.id}
          className="cursor-pointer px-3 py-1 rounded-md text-white"
          style={{ backgroundColor: badge.color }}
          onClick={() => handleBadgeClick(badge.name)}
        >
          {badge.name}
        </Badge>
      ))}
    </div>
  );
};

export default BadgesNav;
