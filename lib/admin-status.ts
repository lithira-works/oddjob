import "server-only";
import { ads } from "./data/ads";

export type StatusRow = { label: string; state: string; todo?: boolean };

type TableState = "created" | "missing" | "unknown";

/** Asks whether a table exists. A 404 means it doesn't. A refusal means it does, and is protected. */
async function tableState(url: string, key: string, table: string): Promise<TableState> {
  try {
    const response = await fetch(`${url}/rest/v1/${table}?select=*&limit=0`, {
      headers: { apikey: key },
      signal: AbortSignal.timeout(3000),
      cache: "no-store",
    });
    if (response.status === 404) return "missing";
    return response.ok || response.status === 401 || response.status === 403 ? "created" : "unknown";
  } catch {
    return "unknown";
  }
}

const tableRow = (label: string, state: TableState, file: string): StatusRow => {
  if (state === "created") return { label, state: "Created" };
  if (state === "missing") return { label, state: `Not created. Run ${file}`, todo: true };
  return { label, state: "Couldn’t check", todo: true };
};

/** Says only whether each value is set. Never returns a key or its value. */
export async function siteStatus(env: Record<string, string | undefined> = process.env): Promise<StatusRow[]> {
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const connected = Boolean(url && key);
  const [base, identity] = connected
    ? await Promise.all([tableState(url!, key!, "profiles"), tableState(url!, key!, "identity_checks")])
    : (["unknown", "unknown"] as const);

  return [
    { label: "Database connection", state: connected ? "Keys set" : "Keys missing", todo: !connected },
    { label: "Database secret key", state: env.SUPABASE_SERVICE_ROLE_KEY ? "Set" : "Not set", todo: !env.SUPABASE_SERVICE_ROLE_KEY },
    tableRow("Main tables", base, "0001_init.sql"),
    tableRow("ID check tables", identity, "0002_identity_checks.sql"),
    { label: "ID checks", state: env.ID_CHECKS_OPEN === "true" ? "Open" : "Closed" },
    { label: "Claude job reading", state: env.ANTHROPIC_API_KEY ? "Key set" : "No key. Keyword matcher in use" },
    { label: "Rate limits", state: env.TRUSTED_IP_HEADER ? "Per visitor" : "Shared. Set TRUSTED_IP_HEADER when deploying", todo: !env.TRUSTED_IP_HEADER },
    { label: "Ads booked", state: ads.length === 0 ? "None" : String(ads.length) },
  ];
}
