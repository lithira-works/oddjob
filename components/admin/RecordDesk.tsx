"use client";

import { ArrowDown, ArrowUp, Pencil, Search, Trash2, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { merged, removeRecords, saveRecord, type CollectionId, type DraftRecord } from "@/lib/admin/drafts";
import { can, ROLE_NAMES, type Area } from "@/lib/admin/roles";
import type { Checked, Errors, Values } from "@/lib/admin/rules";
import { change, useDrafts } from "./store";

export type Column<T> = {
  key: string;
  label: string;
  cell: (row: T) => ReactNode;
  /** Text or number to sort by. A column without one can't be sorted. */
  sort?: (row: T) => string | number;
  /** Goes first when there's less room. */
  low?: boolean;
  /** Long text that may wrap. Short values stay on one line. */
  wrap?: boolean;
  align?: "end";
};

export type Field = {
  name: string;
  label: string;
  type?: "text" | "textarea" | "number" | "date" | "email" | "url";
  options?: readonly { value: string; label: string }[];
  help?: string;
  max?: number;
};

export type RecordDeskProps<T extends DraftRecord> = {
  area: Area;
  collection: CollectionId;
  title: string;
  /** "job" reads as "Add a job" and "Edit job". */
  singular: string;
  article?: "a" | "an";
  /** The action's name when "Add" doesn't suit. */
  addLabel?: string;
  /** Says what the data is. Always on screen. */
  note: string;
  seed: readonly T[];
  columns: Column<T>[];
  filter?: { label: string; options: readonly string[]; pick: (row: T) => string };
  searchText: (row: T) => string;
  fields: Field[];
  blank: () => Values;
  toValues: (row: T) => Values;
  check: (values: Values, editing?: T) => Checked;
  newId: () => string;
  /** Why this row can't be changed at all. */
  locked?: (row: T) => string | undefined;
  /** Why this row can't be deleted right now. */
  cantDelete?: (row: T) => string | undefined;
  /** Figures the form shows but never sets. */
  fixed?: (row: T | undefined) => { label: string; value: string }[];
  fixedNote?: string;
  preview?: (values: Values) => ReactNode;
  /** Sits between the header and the tools. */
  extra?: ReactNode;
  empty: string;
  rowLabel: (row: T) => string;
};

type Editing<T> = { row?: T; values: Values; start: string; errors: Errors; confirm: boolean };

export function RecordDesk<T extends DraftRecord>(props: RecordDeskProps<T>) {
  const { area, collection, title, singular, article = "a", seed, columns, filter, fields, locked, cantDelete } = props;
  const drafts = useDrafts();
  const router = useRouter();
  const params = useSearchParams();
  const rows = useMemo(() => merged(seed, drafts.changes[collection]), [seed, drafts.changes, collection]);
  const seedIds = useMemo(() => new Set(seed.map((r) => r.id)), [seed]);

  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("All");
  const [sort, setSort] = useState<{ key: string; down: boolean } | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [editing, setEditing] = useState<Editing<T> | null>(null);
  const [askDelete, setAskDelete] = useState<string[] | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const form = useRef<HTMLFormElement>(null);

  const mayCreate = can(drafts.role, area, "create");
  const mayEdit = can(drafts.role, area, "edit");
  const mayDelete = can(drafts.role, area, "delete");
  const addLabel = props.addLabel ?? `Add ${article} ${singular}`;

  const open = (row?: T) => {
    const values = row ? props.toValues(row) : props.blank();
    setEditing({ row, values, start: JSON.stringify(values), errors: {}, confirm: false });
  };

  // Opened from the Find box, or a link: ?new=1 or ?edit=id.
  const wanted = params.get("edit");
  const wantNew = params.get("new");
  useEffect(() => {
    if (!wanted && !wantNew) return;
    const row = wanted ? rows.find((r) => r.id === wanted) : undefined;
    if (wantNew && mayCreate) open();
    if (row && mayEdit && !locked?.(row)) open(row);
    router.replace(window.location.pathname, { scroll: false });
    // Runs when the link changes, and only then.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wanted, wantNew]);

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (editing && !el.open) el.showModal();
    if (!editing && el.open) el.close();
  }, [editing]);

  useEffect(() => {
    const keys = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (event.key === "/" && !/INPUT|TEXTAREA|SELECT/.test(target.tagName) && !target.isContentEditable) {
        event.preventDefault();
        search.current?.focus();
      }
    };
    window.addEventListener("keydown", keys);
    return () => window.removeEventListener("keydown", keys);
  }, []);

  const asked = query.trim().toLowerCase();
  const shown = useMemo(() => {
    let list = rows.filter((row) => (!asked || props.searchText(row).toLowerCase().includes(asked)) && (kind === "All" || filter?.pick(row) === kind));
    const column = sort && columns.find((c) => c.key === sort.key);
    if (sort && column?.sort) {
      const value = column.sort;
      list = [...list].sort((a, b) => {
        const [x, y] = [value(a), value(b)];
        const order = typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y));
        return sort.down ? -order : order;
      });
    }
    return list;
    // The config functions are rebuilt each render and only read the row they're given.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, asked, kind, sort]);

  const shownIds = shown.filter((r) => !locked?.(r) && !cantDelete?.(r)).map((r) => r.id);
  const chosen = selected.filter((id) => shownIds.includes(id));
  const allChosen = shownIds.length > 0 && chosen.length === shownIds.length;

  const dirty = editing ? JSON.stringify(editing.values) !== editing.start : false;
  const tryClose = () => {
    if (dirty && !editing?.confirm) setEditing((e) => (e ? { ...e, confirm: true } : e));
    else setEditing(null);
  };

  const save = (event: React.FormEvent) => {
    event.preventDefault();
    if (!editing) return;
    const result = props.check(editing.values, editing.row);
    if (!result.ok) {
      setEditing({ ...editing, errors: result.errors, confirm: false });
      requestAnimationFrame(() => form.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      return;
    }
    const id = (result.data.id as string | undefined) ?? editing.row?.id ?? props.newId();
    const record = { ...(editing.row ?? {}), ...result.data, id } as DraftRecord;
    const isNew = !editing.row;
    change((state) => saveRecord(state, collection, record, isNew, new Date().toISOString()), isNew ? `Draft ${singular} added.` : `Draft ${singular} saved.`);
    setEditing(null);
  };

  const remove = (ids: string[]) => {
    change(
      (state) => removeRecords(state, collection, ids, seedIds, new Date().toISOString()),
      ids.length === 1 ? `${title.replace(/s$/, "")} deleted from the draft.` : `${ids.length} deleted from the draft.`,
    );
    setSelected((list) => list.filter((id) => !ids.includes(id)));
    setAskDelete(null);
    setEditing(null);
  };

  const headerSort = (column: Column<T>) => {
    setSort((current) => (current?.key === column.key ? (current.down ? null : { key: column.key, down: true }) : { key: column.key, down: false }));
  };

  const set = (name: string, value: string) => setEditing((e) => {
    if (!e) return e;
    const errors = { ...e.errors };
    delete errors[name];
    return { ...e, values: { ...e.values, [name]: value }, errors, confirm: false };
  });

  const editingBlock = editing?.row && cantDelete?.(editing.row);

  return (
    <section className="dk">
      <header className="dk__head">
        <div className="dk__headtext">
          <h1 className="display dk__title">{title}</h1>
          <p className="dk__note">{props.note}</p>
        </div>
        {mayCreate ? (
          <button type="button" className="btn dk__add" onClick={() => open()}>{addLabel}</button>
        ) : (
          <p className="small dk__norole">{ROLE_NAMES[drafts.role]}s can’t add here.</p>
        )}
      </header>

      {props.extra}

      <div className="dk__tools">
        <span className="dk__searchbox">
          <Search size={16} strokeWidth={1.75} aria-hidden="true" />
          <input
            ref={search}
            className="input dk__search"
            type="search"
            value={query}
            placeholder={`Search ${title.toLowerCase()}`}
            aria-label={`Search ${title.toLowerCase()}`}
            onChange={(e) => setQuery(e.target.value)}
          />
        </span>
        {filter && (
          <div className="seg" role="group" aria-label={filter.label}>
            {["All", ...filter.options].map((option) => (
              <button key={option} type="button" className="seg__item" aria-current={kind === option ? "true" : undefined} onClick={() => setKind(option)}>{option}</button>
            ))}
          </div>
        )}
      </div>

      <div className="dk__status">
        <p className="small" aria-live="polite">{shown.length === rows.length ? `${rows.length} shown` : `${shown.length} of ${rows.length} shown`}</p>
        {chosen.length > 0 && mayDelete && (
          <div className="dk__bulk">
            <span className="small">{chosen.length} chosen</span>
            <button type="button" className="btn btn--small btn--ink" onClick={() => setAskDelete(chosen)}>Delete</button>
            <button type="button" className="link small" onClick={() => setSelected([])}>Clear</button>
          </div>
        )}
      </div>

      {askDelete && (
        <div className="dk__confirm" role="alertdialog" aria-label="Confirm delete">
          <p>Delete {askDelete.length === 1 ? askDelete[0] : `${askDelete.length} ${title.toLowerCase()}`} from the draft?</p>
          <div className="dk__confirmact">
            <button type="button" className="btn btn--small btn--ink" autoFocus onClick={() => remove(askDelete)}>Delete</button>
            <button type="button" className="btn btn--small btn--white" onClick={() => setAskDelete(null)}>Keep</button>
          </div>
        </div>
      )}

      {shown.length === 0 ? (
        <div className="market__empty dk__empty">
          <p className="dk__emptyhead">{rows.length === 0 ? props.empty : `Nothing matches “${query || kind}”.`}</p>
          {rows.length > 0 && <button type="button" className="btn btn--small btn--white" onClick={() => { setQuery(""); setKind("All"); }}>Clear search</button>}
        </div>
      ) : (
        <div className="dk__tablewrap">
          <table className="dk__table">
            <thead>
              <tr>
                {mayDelete && (
                  <th scope="col" className="dk__check">
                    <input type="checkbox" aria-label={`Choose all shown ${title.toLowerCase()}`} checked={allChosen} disabled={shownIds.length === 0} onChange={() => setSelected(allChosen ? [] : shownIds)} />
                  </th>
                )}
                {columns.map((column) => (
                  <th
                    key={column.key}
                    scope="col"
                    className={`${column.low ? "is-low " : ""}${column.align === "end" ? "is-end" : ""}`}
                    aria-sort={sort?.key === column.key ? (sort.down ? "descending" : "ascending") : undefined}
                  >
                    {column.sort ? (
                      <button type="button" className="dk__sort" onClick={() => headerSort(column)}>
                        {column.label}
                        {sort?.key === column.key && (sort.down ? <ArrowDown size={14} aria-hidden="true" /> : <ArrowUp size={14} aria-hidden="true" />)}
                      </button>
                    ) : column.label}
                  </th>
                ))}
                <th scope="col" className="dk__rowact"><span className="dk__hidden">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {shown.map((row) => {
                const lock = locked?.(row);
                const block = cantDelete?.(row);
                const label = props.rowLabel(row);
                return (
                  <tr key={row.id} className={drafts.changes[collection]?.[row.id] ? "is-draft" : undefined}>
                    {mayDelete && (
                      <td className="dk__check">
                        <input
                          type="checkbox"
                          aria-label={`Choose ${label}`}
                          checked={selected.includes(row.id)}
                          disabled={Boolean(lock || block)}
                          onChange={() => setSelected((list) => (list.includes(row.id) ? list.filter((id) => id !== row.id) : [...list, row.id]))}
                        />
                      </td>
                    )}
                    {columns.map((column, i) => (
                      <td key={column.key} data-label={i === 0 ? undefined : column.label} className={`${i === 0 ? "dk__first " : ""}${column.low ? "is-low " : ""}${column.wrap ? "is-wrap " : ""}${column.align === "end" ? "is-end" : ""}`}>
                        {column.cell(row)}
                        {i === 0 && lock && <span className="small dk__lock">{lock}</span>}
                      </td>
                    ))}
                    <td className="dk__rowact">
                      {!lock && mayEdit && (
                        <button type="button" className="dk__icon" aria-label={`Edit ${label}`} onClick={() => open(row)}>
                          <Pencil size={18} strokeWidth={1.75} aria-hidden="true" />
                        </button>
                      )}
                      {!lock && mayDelete && (
                        <button type="button" className="dk__icon" aria-label={`Delete ${label}`} disabled={Boolean(block)} title={block} onClick={() => setAskDelete([row.id])}>
                          <Trash2 size={18} strokeWidth={1.75} aria-hidden="true" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <dialog
        ref={dialog}
        className="dk__drawer"
        aria-label={editing?.row ? `Edit ${singular}` : addLabel}
        onCancel={(event) => { event.preventDefault(); tryClose(); }}
        onClick={(event) => { if (event.target === dialog.current) tryClose(); }}
      >
        {editing && (
          <form ref={form} className="dk__form" onSubmit={save} noValidate>
            <header className="dk__formhead">
              <h2 className="display dk__formtitle">{editing.row ? `Edit ${singular}` : addLabel}</h2>
              <button type="button" className="dk__icon" aria-label="Close" onClick={tryClose}>
                <X size={20} strokeWidth={1.75} aria-hidden="true" />
              </button>
            </header>
            <div className="dk__formbody">
              {props.preview?.(editing.values)}
              {fields.map((field) => {
                const error = editing.errors[field.name];
                const shared = {
                  name: field.name,
                  value: editing.values[field.name] ?? "",
                  "aria-invalid": error ? (true as const) : undefined,
                  "aria-describedby": error ? `err-${field.name}` : field.help ? `help-${field.name}` : undefined,
                };
                return (
                  <label className="field" key={field.name}>
                    <span>{field.label}</span>
                    {field.options ? (
                      <select className="input" {...shared} onChange={(e) => set(field.name, e.target.value)}>
                        {field.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                      </select>
                    ) : field.type === "textarea" ? (
                      <textarea className="input" maxLength={field.max} {...shared} onChange={(e) => set(field.name, e.target.value)} />
                    ) : (
                      <input className="input" type={field.type ?? "text"} maxLength={field.max} {...shared} onChange={(e) => set(field.name, e.target.value)} />
                    )}
                    {field.help && !error && <span className="small dk__help" id={`help-${field.name}`}>{field.help}</span>}
                    {error && <span className="field__error" id={`err-${field.name}`} role="alert">{error}</span>}
                  </label>
                );
              })}
              {props.fixed && (
                <div className="dk__fixed">
                  <dl>
                    {props.fixed(editing.row).map((item) => (
                      <div key={item.label}><dt>{item.label}</dt><dd className="num">{item.value}</dd></div>
                    ))}
                  </dl>
                  {props.fixedNote && <p className="small">{props.fixedNote}</p>}
                </div>
              )}
            </div>
            <footer className="dk__formfoot">
              {editing.confirm ? (
                <div className="dk__discard" role="alert">
                  <p>Lose what you’ve typed?</p>
                  <button type="button" className="btn btn--small btn--ink" onClick={() => setEditing(null)}>Discard</button>
                  <button type="button" className="btn btn--small btn--white" onClick={() => setEditing({ ...editing, confirm: false })}>Keep editing</button>
                </div>
              ) : (
                <>
                  <button type="submit" className="btn dk__tall">Save draft</button>
                  <button type="button" className="btn btn--white dk__tall" onClick={tryClose}>Cancel</button>
                  {editing.row && mayDelete && (
                    <button type="button" className="link dk__formdelete" disabled={Boolean(editingBlock)} onClick={() => remove([editing.row!.id])}>Delete</button>
                  )}
                </>
              )}
              {editingBlock && !editing.confirm && mayDelete && <p className="small dk__blocked">{editingBlock}</p>}
            </footer>
          </form>
        )}
      </dialog>
    </section>
  );
}
