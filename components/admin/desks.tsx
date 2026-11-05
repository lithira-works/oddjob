"use client";

import { checkAd, checkDeal, checkJob, checkTeam, checkTrade, checkWorker, DEAL_STATUS, JOB_STATUS, slugFrom, TRADE_GROUPS, TRADE_PICTURES, WORKER_STATUS } from "@/lib/admin/rules";
import { merged, type DraftRecord } from "@/lib/admin/drafts";
import { ROLE_NAMES, ROLES, type Role } from "@/lib/admin/roles";
import { AD_SLOTS, adFor, type Ad, type AdSlotId } from "@/lib/data/ads";
import { JOB_WHEN, MAX_REPLIES } from "@/lib/data/jobs";
import { OFFER_KINDS } from "@/lib/data/offers";
import { money } from "@/lib/money";
import { TradeIcon } from "@/components/TradeIcon";
import { RecordDesk } from "./RecordDesk";
import { allDeals, allJobs, allTrades, allWorkers, dealSeed, jobSeed, openTradeSlugs, tradeLabel, tradeSeed, workerSeed, type DealRow, type JobRow, type TradeRow, type WorkerRow } from "./records";
import { useDrafts } from "./store";

const SAMPLE = "Sample data, labelled on the site too. Changes here stay in this browser.";
const shortId = (prefix: string) => `${prefix}-${crypto.randomUUID().slice(0, 6)}`;
const asOptions = (items: readonly string[]) => items.map((value) => ({ value, label: value }));

const ON_STATES = new Set(["Open", "Listed", "Live"]);

function Status({ value }: { value: string }) {
  return <span className={`dk__mark${ON_STATES.has(value) ? " dk__mark--on" : ""}`}>{value}</span>;
}

function TradeTag({ slug, name }: { slug: string; name: string }) {
  return <span className="tradetag"><TradeIcon slug={slug} size={18} />{name}</span>;
}

function useTradeOptions() {
  const drafts = useDrafts();
  const list = allTrades(drafts);
  return {
    options: list.filter((t) => !t.gated).map((t) => ({ value: t.slug, label: tradeLabel(t) })),
    nameOf: (slug: string) => {
      const trade = list.find((t) => t.slug === slug);
      return trade ? tradeLabel(trade) : slug;
    },
    open: openTradeSlugs(drafts),
  };
}

/** The job card itself, updating as you type: the household's words are the record. */
function JobCardPreview({ values, trade }: { values: Record<string, string>; trade: string }) {
  return (
    <div className="ticket dk__ticket on-dark" aria-hidden="true">
      <div className="ticket__top"><span>{trade}</span><span>{values.when}</span></div>
      <p className="display ticket__words dk__ticketwords">{values.words?.trim() || "Say what’s wrong"}</p>
      <p className="small">{values.area?.trim() || "Rough area"}</p>
    </div>
  );
}

export function JobsDesk() {
  const trade = useTradeOptions();
  return (
    <RecordDesk<JobRow>
      area="jobs"
      collection="jobs"
      title="Jobs"
      singular="job"
      note={SAMPLE}
      seed={jobSeed}
      columns={[
        { key: "words", label: "What’s wrong", sort: (j) => j.words, cell: (j) => <span className="display dk__words">{j.words}</span> },
        { key: "trade", label: "Trade", sort: (j) => trade.nameOf(j.tradeSlug), cell: (j) => <TradeTag slug={j.tradeSlug} name={trade.nameOf(j.tradeSlug)} /> },
        { key: "area", label: "Rough area", low: true, sort: (j) => j.area, cell: (j) => j.area },
        { key: "when", label: "When", sort: (j) => JOB_WHEN.indexOf(j.when), cell: (j) => j.when },
        { key: "replies", label: "Replies", low: true, sort: (j) => j.replies, cell: (j) => <span className="num">{j.replies} of {MAX_REPLIES}</span> },
        { key: "cost", label: "Credits", low: true, align: "end", sort: (j) => j.cost, cell: (j) => <span className="num">{j.cost}</span> },
        { key: "status", label: "Status", sort: (j) => j.status, cell: (j) => <Status value={j.status} /> },
      ]}
      filter={{ label: "Filter by when", options: JOB_WHEN, pick: (j) => j.when }}
      searchText={(j) => `${j.id} ${j.words} ${j.note} ${j.area} ${trade.nameOf(j.tradeSlug)}`}
      fields={[
        { name: "words", label: "What’s wrong", max: 120 },
        { name: "note", label: "A little more", type: "textarea", max: 240 },
        { name: "tradeSlug", label: "Trade", options: trade.options, help: "Care work isn’t on this list. It stays closed." },
        { name: "area", label: "Rough area", max: 60, help: "Never a house number or street." },
        { name: "when", label: "When", options: asOptions(JOB_WHEN) },
        { name: "cost", label: "Credits to answer", type: "number" },
        { name: "status", label: "Status", options: asOptions(JOB_STATUS) },
      ]}
      blank={() => ({ words: "", note: "", tradeSlug: trade.options[0]?.value ?? "", area: "", when: "This week", cost: "3", status: "Open" })}
      toValues={(j) => ({ words: j.words, note: j.note, tradeSlug: j.tradeSlug, area: j.area, when: j.when, cost: String(j.cost), status: j.status })}
      check={(values) => {
        const result = checkJob(values, trade.open);
        return result.ok ? { ok: true, data: { replies: 0, ...result.data } } : result;
      }}
      newId={() => shortId("j")}
      fixed={(j) => [{ label: "Replies", value: `${j?.replies ?? 0} of ${MAX_REPLIES}` }]}
      fixedNote="Replies come from workers answering. They can’t be typed in."
      preview={(values) => <JobCardPreview values={values} trade={trade.nameOf(values.tradeSlug ?? "")} />}
      empty="No jobs yet."
      rowLabel={(j) => j.id}
    />
  );
}

export function WorkersDesk() {
  const drafts = useDrafts();
  const trade = useTradeOptions();
  const deals = allDeals(drafts);
  return (
    <RecordDesk<WorkerRow>
      area="workers"
      collection="workers"
      title="Workers"
      singular="worker"
      note={SAMPLE}
      seed={workerSeed}
      columns={[
        { key: "name", label: "Name", sort: (w) => w.name, cell: (w) => <span className="display dk__words">{w.name}</span> },
        { key: "trade", label: "Trade", sort: (w) => trade.nameOf(w.tradeSlug), cell: (w) => <TradeTag slug={w.tradeSlug} name={trade.nameOf(w.tradeSlug)} /> },
        { key: "area", label: "Rough area", low: true, sort: (w) => w.area, cell: (w) => w.area },
        { key: "booked", label: "Booked", align: "end", sort: (w) => w.booked, cell: (w) => <span className="num">{w.booked}</span> },
        { key: "redone", label: "Redone", align: "end", low: true, sort: (w) => w.redone, cell: (w) => <span className="num">{w.redone}</span> },
        { key: "rehired", label: "Rehired", align: "end", low: true, sort: (w) => w.rehired, cell: (w) => <span className="num">{w.rehired}</span> },
        { key: "status", label: "Status", sort: (w) => w.status, cell: (w) => <Status value={w.status} /> },
      ]}
      filter={{ label: "Filter by status", options: WORKER_STATUS, pick: (w) => w.status }}
      searchText={(w) => `${w.name} ${w.area} ${w.about} ${trade.nameOf(w.tradeSlug)}`}
      fields={[
        { name: "name", label: "Name", max: 40 },
        { name: "tradeSlug", label: "Trade", options: trade.options },
        { name: "area", label: "Rough area", max: 60 },
        { name: "about", label: "About", type: "textarea", max: 240 },
        { name: "years", label: "Years in the trade", type: "number" },
        { name: "quote", label: "Typical quote", type: "number" },
        { name: "arrives", label: "Usually arrives", max: 40 },
        { name: "status", label: "Status", options: asOptions(WORKER_STATUS), help: "Paused workers won’t get new jobs." },
      ]}
      blank={() => ({ name: "", tradeSlug: trade.options[0]?.value ?? "", area: "", about: "", years: "0", quote: "0", arrives: "", status: "Listed" })}
      toValues={(w) => ({ name: w.name, tradeSlug: w.tradeSlug, area: w.area, about: w.about, years: String(w.years), quote: String(w.quote), arrives: w.arrives, status: w.status })}
      check={(values, editing) => {
        const result = checkWorker(values, trade.open);
        if (!result.ok) return result;
        return { ok: true, data: { ...result.data, ...(editing ? {} : { booked: 0, redone: 0, rehired: 0, checks: [], pastJobs: [], slug: "" }) } };
      }}
      newId={() => shortId("w")}
      cantDelete={(w) => (deals.some((d) => d.providerSlug === w.id) ? "Has a deal running. Remove the deal first." : undefined)}
      fixed={(w) => [
        { label: "Booked", value: String(w?.booked ?? 0) },
        { label: "Redone", value: String(w?.redone ?? 0) },
        { label: "Rehired", value: String(w?.rehired ?? 0) },
        { label: "Checks", value: w?.checks.join(", ") || "None" },
      ]}
      fixedNote="These come from finished jobs and ID reviews. Nobody can type them in, so a worker’s record stays honest."
      empty="Nobody listed yet."
      rowLabel={(w) => w.name}
    />
  );
}

export function TradesDesk() {
  const drafts = useDrafts();
  const jobs = allJobs(drafts);
  const workers = allWorkers(drafts);
  const deals = allDeals(drafts);
  const taken = allTrades(drafts).map((t) => t.slug);
  return (
    <RecordDesk<TradeRow>
      area="trades"
      collection="trades"
      title="Trades"
      singular="trade"
      note={SAMPLE}
      seed={tradeSeed}
      columns={[
        { key: "name", label: "Trade", sort: (t) => tradeLabel(t), cell: (t) => <TradeTag slug={t.slug} name={tradeLabel(t)} /> },
        { key: "group", label: "Group", low: true, sort: (t) => t.group, cell: (t) => t.group },
        { key: "jobs", label: "Typical jobs", low: true, wrap: true, cell: (t) => t.jobs },
        { key: "words", label: "Words", align: "end", low: true, sort: (t) => t.words.length, cell: (t) => <span className="num">{t.words.length}</span> },
        { key: "home", label: "On homepage", sort: (t) => (t.featured ? "Yes" : "No"), cell: (t) => (t.featured ? "Yes" : "No") },
        { key: "state", label: "State", sort: (t) => (t.gated ? "Closed" : "Open"), cell: (t) => <Status value={t.gated ? "Closed" : "Open"} /> },
      ]}
      filter={{ label: "Filter by group", options: TRADE_GROUPS, pick: (t) => t.group }}
      searchText={(t) => `${t.name} ${t.service ?? ""} ${t.jobs} ${t.words.join(" ")}`}
      fields={[
        { name: "name", label: "Name", max: 40, help: "Lower case. It reads after “a job for a”." },
        { name: "article", label: "A or an", options: asOptions(["a", "an"]) },
        { name: "service", label: "Service name, if the title is long", max: 40 },
        { name: "group", label: "Group", options: asOptions(TRADE_GROUPS) },
        { name: "jobs", label: "Typical jobs", max: 80 },
        { name: "words", label: "Words a household might use", type: "textarea", max: 800, help: "Separate with commas. These decide which trade a job goes to." },
        { name: "image", label: "Picture", options: TRADE_PICTURES.map((p) => ({ value: p.image, label: p.alt })), help: "Credited pictures only." },
        { name: "featured", label: "Show on the homepage", options: asOptions(["Yes", "No"]) },
      ]}
      blank={() => ({ name: "", article: "a", service: "", group: "Inside", jobs: "", words: "", image: TRADE_PICTURES[0]!.image, featured: "No" })}
      toValues={(t) => ({ name: t.name, article: t.article, service: t.service ?? "", group: t.group, jobs: t.jobs, words: t.words.join(", "), image: t.image, featured: t.featured ? "Yes" : "No" })}
      check={(values, editing) => checkTrade(values, taken, editing?.id)}
      newId={() => slugFrom(`trade-${crypto.randomUUID().slice(0, 6)}`)}
      locked={(t) => (t.gated ? "Closed until the safety checks and a lawyer’s review." : undefined)}
      cantDelete={(t) => {
        const used = jobs.filter((j) => j.tradeSlug === t.slug).length + workers.filter((w) => w.tradeSlug === t.slug).length + deals.filter((d) => d.tradeSlug === t.slug).length;
        return used ? `In use by ${used} ${used === 1 ? "record" : "records"}. Move them first.` : undefined;
      }}
      empty="No trades."
      rowLabel={(t) => tradeLabel(t)}
    />
  );
}

export function DealsDesk() {
  const drafts = useDrafts();
  const trade = useTradeOptions();
  const workers = allWorkers(drafts);
  const nameOf = (slug: string) => workers.find((w) => w.id === slug)?.name ?? slug;
  return (
    <RecordDesk<DealRow>
      area="deals"
      collection="deals"
      title="Deals"
      singular="deal"
      note="Sample offers. None can be redeemed, and changes here stay in this browser."
      seed={dealSeed}
      columns={[
        { key: "amount", label: "Amount", sort: (d) => d.amount, cell: (d) => <span className="display dk__words deal__amount">{d.amount}</span> },
        { key: "title", label: "Offer", wrap: true, sort: (d) => d.title, cell: (d) => <span className="dk__strong">{d.title}</span> },
        { key: "who", label: "From", low: true, sort: (d) => nameOf(d.providerSlug), cell: (d) => nameOf(d.providerSlug) },
        { key: "trade", label: "Trade", low: true, sort: (d) => trade.nameOf(d.tradeSlug), cell: (d) => <TradeTag slug={d.tradeSlug} name={trade.nameOf(d.tradeSlug)} /> },
        { key: "kind", label: "Kind", low: true, sort: (d) => d.kind, cell: (d) => d.kind },
        { key: "status", label: "Status", sort: (d) => d.status, cell: (d) => <Status value={d.status} /> },
      ]}
      filter={{ label: "Filter by kind", options: OFFER_KINDS, pick: (d) => d.kind }}
      searchText={(d) => `${d.amount} ${d.title} ${d.terms} ${nameOf(d.providerSlug)}`}
      fields={[
        { name: "amount", label: "Amount", max: 10, help: "Set large, so keep it short." },
        { name: "title", label: "What it’s for", max: 60 },
        { name: "terms", label: "Terms", type: "textarea", max: 140 },
        { name: "kind", label: "Kind", options: asOptions(OFFER_KINDS) },
        { name: "tradeSlug", label: "Trade", options: trade.options },
        { name: "providerSlug", label: "From", options: workers.map((w) => ({ value: w.id, label: w.name })) },
        { name: "status", label: "Status", options: asOptions(DEAL_STATUS) },
      ]}
      blank={() => ({ amount: "", title: "", terms: "", kind: "Discounts", tradeSlug: trade.options[0]?.value ?? "", providerSlug: workers[0]?.id ?? "", status: "Live" })}
      toValues={(d) => ({ amount: d.amount, title: d.title, terms: d.terms, kind: d.kind, tradeSlug: d.tradeSlug, providerSlug: d.providerSlug, status: d.status })}
      check={(values) => checkDeal(values, trade.open, workers.map((w) => w.id))}
      newId={() => shortId("o")}
      empty="No deals yet."
      rowLabel={(d) => d.title}
    />
  );
}

type AdRow = Ad & { id: string };
const NO_ADS: AdRow[] = [];
const SLOT_OPTIONS = (Object.entries(AD_SLOTS) as [AdSlotId, string][]).map(([value, label]) => ({ value, label }));

export function AdsDesk() {
  const drafts = useDrafts();
  const booked = merged(NO_ADS as unknown as DraftRecord[], drafts.changes.ads) as unknown as AdRow[];
  const today = new Date().toISOString().slice(0, 10);
  return (
    <RecordDesk<AdRow>
      area="ads"
      collection="ads"
      title="Banner ads"
      singular="ad"
      article="an"
      addLabel="Book an ad"
      note="No ads are booked on the live site. Bookings here stay in this browser, and go live only by editing lib/data/ads.ts."
      seed={NO_ADS}
      extra={(
        <div className="dk__panel">
          <h2 className="dk__panelhead">Spaces today</h2>
          <table className="dk__spaces">
            <tbody>
              {SLOT_OPTIONS.map((slot) => {
                const ad = adFor(slot.value, today, booked);
                return (
                  <tr key={slot.value}>
                    <th scope="row">{slot.label}</th>
                    <td>{ad ? ad.advertiser : "Free"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      columns={[
        { key: "advertiser", label: "Advertiser", sort: (a) => a.advertiser, cell: (a) => <span className="dk__strong">{a.advertiser}</span> },
        { key: "slot", label: "Space", wrap: true, sort: (a) => a.slot, cell: (a) => AD_SLOTS[a.slot] },
        { key: "from", label: "First day", sort: (a) => a.from, cell: (a) => <span className="num">{a.from}</span> },
        { key: "until", label: "Last day", sort: (a) => a.until, cell: (a) => <span className="num">{a.until}</span> },
      ]}
      searchText={(a) => `${a.advertiser} ${a.slot}`}
      fields={[
        { name: "advertiser", label: "Advertiser", max: 60, help: "Always shown with the ad." },
        { name: "slot", label: "Space", options: SLOT_OPTIONS },
        { name: "href", label: "Link", type: "url", max: 300, help: "https only." },
        { name: "image", label: "Wide picture", max: 200, help: "1600 by 400. A path under /ads/, credited like every picture." },
        { name: "imagePhone", label: "Phone picture", max: 200, help: "800 by 400. A path under /ads/." },
        { name: "alt", label: "What the picture shows", max: 160 },
        { name: "from", label: "First day", type: "date" },
        { name: "until", label: "Last day", type: "date" },
      ]}
      blank={() => ({ advertiser: "", slot: "home-top", href: "", image: "", imagePhone: "", alt: "", from: today, until: today })}
      toValues={(a) => ({ advertiser: a.advertiser, slot: a.slot, href: a.href, image: a.image, imagePhone: a.imagePhone, alt: a.alt, from: a.from, until: a.until })}
      check={(values, editing) => checkAd(values, booked.filter((a) => a.id !== editing?.id))}
      newId={() => shortId("ad")}
      empty="No ads booked. Every space offers itself for hire until one is."
      rowLabel={(a) => a.advertiser}
    />
  );
}

type TeamRow = { id: string; name: string; email: string; role: Role };

export function TeamDesk({ email }: { email: string }) {
  const seed: TeamRow[] = [{ id: "owner", name: "You", email, role: "admin" }];
  return (
    <RecordDesk<TeamRow>
      area="team"
      collection="team"
      title="Team"
      singular="manager"
      addLabel="Add a manager"
      note="Your account is real. Anyone added here is a draft: no login is created, and they can’t get in."
      seed={seed}
      columns={[
        { key: "name", label: "Name", sort: (t) => t.name, cell: (t) => <span className="dk__strong">{t.name}</span> },
        { key: "email", label: "Email", sort: (t) => t.email, cell: (t) => t.email },
        { key: "role", label: "Role", sort: (t) => t.role, cell: (t) => ROLE_NAMES[t.role] },
        { key: "login", label: "Can log in", cell: (t) => (t.id === "owner" ? "Yes" : "No") },
      ]}
      searchText={(t) => `${t.name} ${t.email} ${t.role}`}
      fields={[
        { name: "name", label: "Name", max: 60 },
        { name: "email", label: "Work email", type: "email", max: 254 },
        { name: "role", label: "Role", options: ROLES.map((role) => ({ value: role, label: ROLE_NAMES[role] })) },
      ]}
      blank={() => ({ name: "", email: "", role: "manager" })}
      toValues={(t) => ({ name: t.name, email: t.email, role: t.role })}
      check={checkTeam}
      newId={() => shortId("t")}
      locked={(t) => (t.id === "owner" ? "Changed only with npm run admin:create." : undefined)}
      empty="Nobody yet."
      rowLabel={(t) => t.name}
    />
  );
}
