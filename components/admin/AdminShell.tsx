"use client";

import { Menu, Search, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { AdminLogout } from "@/components/AdminForms";
import { draftCount, type DraftState } from "@/lib/admin/drafts";
import { can, ROLE_NAMES, ROLES, type Role } from "@/lib/admin/roles";
import { allDeals, allJobs, allTrades, allWorkers, tradeLabel } from "./records";
import { change, discardAll, dismissToast, undo, useDrafts, useToast } from "./store";
import { ALL_TABS, TAB_GROUPS, type Tab } from "./tabs";

const isCurrent = (path: string, href: string) => (href === "/admin" ? path === "/admin" : path.startsWith(href));

function counts(drafts: DraftState, feedbackKeys: readonly string[]): Record<string, number> {
  return {
    "/admin/jobs": allJobs(drafts).length,
    "/admin/workers": allWorkers(drafts).length,
    "/admin/trades": allTrades(drafts).length,
    "/admin/deals": allDeals(drafts).length,
    "/admin/feedback": feedbackKeys.filter((key) => !drafts.handled.includes(key)).length,
  };
}

function TabLink({ tab, path, count, onGo }: { tab: Tab; path: string; count?: number; onGo?: () => void }) {
  const Icon = tab.icon;
  return (
    <Link href={tab.href} prefetch={false} className="dsk__tab" aria-current={isCurrent(path, tab.href) ? "page" : undefined} onClick={onGo}>
      <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
      <span className="dsk__tabname">{tab.label}</span>
      {tab.notBuilt ? <span className="dsk__tabnote">Not built</span> : count !== undefined && <span className="dsk__tabnote num">{count}</span>}
    </Link>
  );
}

function TabList({ path, role, tally, onGo }: { path: string; role: Role; tally: Record<string, number>; onGo?: () => void }) {
  return (
    <>
      {TAB_GROUPS.map((group) => {
        const shown = group.tabs.filter((tab) => !tab.area || can(role, tab.area, "view"));
        if (shown.length === 0) return null;
        return (
          <div className="dsk__group" key={group.name ?? "top"}>
            {group.name && <p className="dsk__groupname">{group.name}</p>}
            <ul>
              {shown.map((tab) => (
                <li key={tab.href}><TabLink tab={tab} path={path} count={tally[tab.href]} onGo={onGo} /></li>
              ))}
            </ul>
          </div>
        );
      })}
    </>
  );
}

function RoleSwitch({ role }: { role: Role }) {
  return (
    <div className="dsk__role" role="group" aria-label="Preview the desk as">
      <span className="small dsk__rolelabel">Preview as</span>
      <div className="dsk__rolebtns">
        {ROLES.map((option) => (
          <button key={option} type="button" aria-pressed={role === option} onClick={() => change((s) => ({ ...s, role: option }))}>
            {ROLE_NAMES[option]}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Jump to any tab or sample record from the keyboard. */
function Palette({ open, onClose, role, drafts }: { open: boolean; onClose: () => void; role: Role; drafts: DraftState }) {
  const ref = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      setQuery("");
      setActive(0);
      dialog.showModal();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const everything = useMemo(() => {
    if (!open) return [];
    const tabs = ALL_TABS.filter((t) => !t.area || can(role, t.area, "view")).map((t) => ({ key: t.href, text: t.label, where: "Tab", href: t.href }));
    const adds = [
      { area: "jobs", text: "Add a job", href: "/admin/jobs?new=1" },
      { area: "workers", text: "Add a worker", href: "/admin/workers?new=1" },
      { area: "deals", text: "Add a deal", href: "/admin/deals?new=1" },
      { area: "ads", text: "Book an ad", href: "/admin/ads?new=1" },
    ].filter((a) => can(role, a.area as "jobs", "create")).map((a) => ({ key: a.href, text: a.text, where: "Action", href: a.href }));
    return [
      ...tabs,
      ...adds,
      ...allJobs(drafts).map((j) => ({ key: `j${j.id}`, text: j.words, where: "Job", href: `/admin/jobs?edit=${encodeURIComponent(j.id)}` })),
      ...allWorkers(drafts).map((w) => ({ key: `w${w.id}`, text: w.name, where: "Worker", href: `/admin/workers?edit=${encodeURIComponent(w.id)}` })),
      ...allTrades(drafts).map((t) => ({ key: `t${t.id}`, text: tradeLabel(t), where: "Trade", href: `/admin/trades?edit=${encodeURIComponent(t.id)}` })),
      ...allDeals(drafts).map((d) => ({ key: `d${d.id}`, text: d.title, where: "Deal", href: `/admin/deals?edit=${encodeURIComponent(d.id)}` })),
    ];
  }, [open, role, drafts]);

  const asked = query.trim().toLowerCase();
  const results = (asked ? everything.filter((row) => row.text.toLowerCase().includes(asked)) : everything).slice(0, 9);

  const go = (href: string) => {
    onClose();
    router.push(href);
  };

  const keys = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (event.key === "Enter" && results[active]) {
      event.preventDefault();
      go(results[active].href);
    }
  };

  return (
    <dialog ref={ref} className="dsk__palette" aria-label="Find anything" onClose={onClose} onClick={(e) => { if (e.target === ref.current) onClose(); }}>
      <div className="dsk__palettebox">
        <input
          className="input"
          value={query}
          placeholder="Find a tab, job, worker or trade"
          aria-label="Find a tab, job, worker or trade"
          autoFocus
          onChange={(e) => { setQuery(e.target.value); setActive(0); }}
          onKeyDown={keys}
        />
        {results.length === 0 ? (
          <p className="dsk__paletteempty">Nothing called that.</p>
        ) : (
          <ul className="dsk__results">
            {results.map((row, i) => (
              <li key={row.key}>
                <button type="button" className={i === active ? "is-on" : undefined} onMouseMove={() => setActive(i)} onClick={() => go(row.href)}>
                  <span className="dsk__resulttext">{row.text}</span>
                  <span className="small">{row.where}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </dialog>
  );
}

export function AdminShell({ email, feedbackKeys, children }: { email: string; feedbackKeys: string[]; children: React.ReactNode }) {
  const path = usePathname();
  const drafts = useDrafts();
  const toast = useToast();
  const [finding, setFinding] = useState(false);
  const [menu, setMenu] = useState(false);
  const menuRef = useRef<HTMLDialogElement>(null);
  const pending = draftCount(drafts);
  const tally = counts(drafts, feedbackKeys);

  useEffect(() => {
    const keys = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setFinding(true);
      }
    };
    window.addEventListener("keydown", keys);
    return () => window.removeEventListener("keydown", keys);
  }, []);

  useEffect(() => {
    const dialog = menuRef.current;
    if (!dialog) return;
    if (menu && !dialog.open) dialog.showModal();
    if (!menu && dialog.open) dialog.close();
  }, [menu]);

  const phoneTabs = ALL_TABS.filter((tab) => tab.phone);

  return (
    <div className="dsk">
      <a className="dsk__skip" href="#desk-main">Skip to the page</a>

      <aside className="dsk__side on-dark">
        <div className="dsk__brand">
          <Link href="/" className="display nav__mark">Oddjob</Link>
          <span className="small">Admin</span>
        </div>
        <button type="button" className="dsk__find" onClick={() => setFinding(true)}>
          <Search size={16} strokeWidth={1.75} aria-hidden="true" />
          <span>Find anything</span>
          <span className="small dsk__hint">Ctrl K</span>
        </button>
        <nav className="dsk__nav" aria-label="Admin tabs">
          <TabList path={path} role={drafts.role} tally={tally} />
        </nav>
        <div className="dsk__foot">
          <RoleSwitch role={drafts.role} />
          <p className="small dsk__email" title={email}>{email}</p>
          <AdminLogout />
        </div>
      </aside>

      <header className="dsk__top on-dark">
        <Link href="/" className="display nav__mark">Oddjob</Link>
        <div className="dsk__topact">
          <button type="button" className="dsk__iconbtn" aria-label="Find anything" onClick={() => setFinding(true)}>
            <Search size={20} strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>
      </header>

      <div className="dsk__body">
        {pending > 0 && (
          <div className="dsk__drafts" role="status">
            <p><b className="num">{pending}</b> {pending === 1 ? "draft change" : "draft changes"} in this browser. The live site hasn’t changed.</p>
            <div className="dsk__draftact">
              <Link href="/admin/activity" prefetch={false} className="link">Review</Link>
              <button type="button" className="link" onClick={discardAll}>Discard all</button>
            </div>
          </div>
        )}
        <main id="desk-main" className="dsk__main">{children}</main>
      </div>

      <nav className="dsk__tabbar" aria-label="Main admin tabs">
        {phoneTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <Link key={tab.href} href={tab.href} prefetch={false} className="tabbar__item" aria-current={isCurrent(path, tab.href) ? "page" : undefined}>
              <Icon size={22} strokeWidth={1.75} aria-hidden="true" />
              {tab.label}
            </Link>
          );
        })}
        <button type="button" className="tabbar__item" onClick={() => setMenu(true)}>
          <Menu size={22} strokeWidth={1.75} aria-hidden="true" />
          More
        </button>
      </nav>

      <dialog ref={menuRef} className="dsk__menu on-dark" aria-label="All admin tabs" onClose={() => setMenu(false)}>
        <div className="dsk__menuhead">
          <span className="display nav__mark">Admin</span>
          <button type="button" className="dsk__iconbtn" aria-label="Close" onClick={() => setMenu(false)}>
            <X size={22} strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>
        <TabList path={path} role={drafts.role} tally={tally} onGo={() => setMenu(false)} />
        <div className="dsk__foot">
          <RoleSwitch role={drafts.role} />
          <p className="small dsk__email">{email}</p>
          <AdminLogout />
        </div>
      </dialog>

      <Palette open={finding} onClose={() => setFinding(false)} role={drafts.role} drafts={drafts} />

      <div className="dsk__toasts" aria-live="polite">
        {toast && (
          <div className="dsk__toast on-dark" key={toast.id}>
            <span>{toast.text}</span>
            {toast.undo && <button type="button" className="link" onClick={undo}>Undo</button>}
            <button type="button" className="dsk__iconbtn dsk__iconbtn--small" aria-label="Dismiss" onClick={dismissToast}>
              <X size={16} strokeWidth={1.75} aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
