import {
  ClipboardList, Coins, HardHat, History, IdCard, LayoutDashboard, Megaphone, MessageSquare,
  Scale, Settings2, ShieldCheck, Tag, UsersRound, Wrench, type LucideIcon,
} from "lucide-react";
import type { Area } from "@/lib/admin/roles";

export type Tab = { href: string; label: string; icon: LucideIcon; area?: Area; phone?: boolean; notBuilt?: boolean };
export type TabGroup = { name?: string; tabs: Tab[] };

export const TAB_GROUPS: TabGroup[] = [
  { tabs: [{ href: "/admin", label: "Overview", icon: LayoutDashboard, phone: true }] },
  {
    name: "Marketplace",
    tabs: [
      { href: "/admin/jobs", label: "Jobs", icon: ClipboardList, area: "jobs", phone: true },
      { href: "/admin/workers", label: "Workers", icon: HardHat, area: "workers", phone: true },
      { href: "/admin/trades", label: "Trades", icon: Wrench, area: "trades" },
      { href: "/admin/deals", label: "Deals", icon: Tag, area: "deals" },
    ],
  },
  {
    name: "Money",
    tabs: [
      { href: "/admin/credits", label: "Credits", icon: Coins, area: "credits" },
      { href: "/admin/ads", label: "Banner ads", icon: Megaphone, area: "ads" },
    ],
  },
  {
    name: "People",
    tabs: [
      { href: "/admin/feedback", label: "Feedback", icon: MessageSquare, area: "feedback", phone: true },
      { href: "/admin/accounts", label: "Accounts", icon: UsersRound, area: "accounts", notBuilt: true },
      { href: "/admin/checks", label: "ID checks", icon: IdCard, area: "checks", notBuilt: true },
      { href: "/admin/disputes", label: "Disputes", icon: Scale, area: "disputes", notBuilt: true },
    ],
  },
  {
    name: "Running the site",
    tabs: [
      { href: "/admin/team", label: "Team", icon: ShieldCheck, area: "team" },
      { href: "/admin/activity", label: "Activity", icon: History, area: "activity" },
      { href: "/admin/setup", label: "Setup", icon: Settings2, area: "setup" },
    ],
  },
];

export const ALL_TABS = TAB_GROUPS.flatMap((group) => group.tabs);
