/**
 * Who may do what on the admin desk. One table, used by the screens and shown on the Team tab,
 * so the two can't disagree.
 *
 * Only a preview for now: there is one real account and no manager login exists. When real
 * changes arrive, the server must enforce this table on every request. See docs/SECURITY.md.
 */
export const ROLES = ["admin", "manager"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_NAMES: Record<Role, string> = { admin: "Admin", manager: "Manager" };

export type Action = "view" | "create" | "edit" | "delete";

export const AREAS = {
  jobs: "Jobs",
  workers: "Workers",
  trades: "Trades",
  deals: "Deals",
  credits: "Credits",
  ads: "Banner ads",
  accounts: "Accounts",
  checks: "ID checks",
  disputes: "Disputes",
  feedback: "Feedback",
  team: "Team",
  activity: "Activity",
  setup: "Setup",
} as const;
export type Area = keyof typeof AREAS;

const ALL: readonly Action[] = ["view", "create", "edit", "delete"];
const VIEW: readonly Action[] = ["view"];

const MANAGER: Record<Area, readonly Action[]> = {
  jobs: ALL,
  workers: ALL,
  trades: ["view", "edit"],
  deals: ALL,
  // Money stays with admins, and real refunds will also need a second approver.
  credits: VIEW,
  ads: ["view", "create", "edit"],
  accounts: VIEW,
  checks: VIEW,
  disputes: VIEW,
  feedback: ["view", "edit"],
  team: [],
  activity: VIEW,
  setup: [],
};

export const can = (role: Role, area: Area, action: Action) =>
  role === "admin" || MANAGER[area].includes(action);
