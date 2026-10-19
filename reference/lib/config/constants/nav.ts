import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Backpack,
  ShoppingBag,
  Store,
  Trophy,
} from "lucide-react";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  description: string;
}

export const PUBLIC_PAGE_PATHS = ["/", "/wiki"] as const;
export const AUTHENTICATED_BROWSING_PATHS = [
  "/marketplace",
  "/leaderboard",
] as const;

export const NAV_ITEMS: NavItem[] = [
  {
    to: "/dashboard",
    label: "Rig",
    icon: LayoutDashboard,
    description: "Exposed Hold, mining, stats and activity",
  },
  {
    to: "/inventory",
    label: "Inventory",
    icon: Backpack,
    description: "All the modules you own",
  },
  {
    to: "/shop",
    label: "Supply Depot",
    icon: Store,
    description: "Buy Salvage Cache stock, Disruptors and Repair Kits",
  },
  {
    to: "/marketplace",
    label: "Outpost Exchange",
    icon: ShoppingBag,
    description: "Buy and sell rig parts",
  },
  {
    to: "/leaderboard",
    label: "Operator Rankings",
    icon: Trophy,
    description: "Combined Renown, mining and XP score",
  },
];
