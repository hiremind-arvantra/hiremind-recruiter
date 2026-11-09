"use client";

import { useEffect, useId, useRef, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { TabBar } from "@/components/ui/TabBar";
import { AIInsight, NeuralMesh } from "@/components/ui/AIInsight";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { MatchScore } from "@/components/ui/MatchScore";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  parseResume,
  saveCandidate,
  listSavedCandidates,
  sendMessage,
  getCandidateMatches,
  type ParsedCandidate,
  type SavedCandidate,
  type JobMatch,
  type MessageChannel,
  type SendMessageResult,
} from "./services/candidates.service";

const TABS = ["All Candidates", "Imported", "Shortlisted", "Contacted", "Archived"] as const;
type Tab = (typeof TABS)[number];

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const PARSE_CONCURRENCY = 3; // how many resumes we parse at once during bulk upload

/** One resume in the (possibly bulk) parse queue. */
type ItemStatus = "parsing" | "ready" | "error" | "saving" | "saved";
interface ParseItem {
  key: string;
  fileName: string;
  status: ItemStatus;
  parsed: ParsedCandidate | null;
  matches: JobMatch[] | null; // null = still scoring
  error: string | null;
}

let itemSeq = 0;
const nextKey = () => `item-${itemSeq++}`;

/** Empty-state copy per tab. */
const EMPTY_COPY: Record<Tab, { heading: string; sub: string }> = {
  "All Candidates": { heading: "No Candidates Yet", sub: "Upload resumes to get started. We'll help you build your talent pipeline." },
  Imported: { heading: "No Imported Candidates", sub: "Candidates added via resume upload or bulk import will appear here." },
  Shortlisted: { heading: "No Shortlisted Candidates", sub: "Shortlist candidates from your pipeline to keep your top picks here." },
  Contacted: { heading: "No Contacted Candidates", sub: "Candidates you've reached out to via email or SMS will show up here." },
  Archived: { heading: "No Archived Candidates", sub: "Candidates you archive are kept here, out of your active pipeline." },
};

export default function CandidatesPage() {
  const [tab, setTab] = useState<Tab>("All Candidates");
  const [items, setItems] = useState<ParseItem[]>([]);
  const [saved, setSaved] = useState<SavedCandidate[]>([]);
  const [savedLoading, setSavedLoading] = useState(true);
  const [composeChannel, setComposeChannel] = useState<MessageChannel | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchId = useId();

  const browse = () => fileInputRef.current?.click();

  function loadSaved() {
    listSavedCandidates()
      .then(setSaved)
      .catch(() => {})
      .finally(() => setSavedLoading(false));
  }
  useEffect(() => { loadSaved(); }, []);

  const patchItem = (key: string, patch: Partial<ParseItem>) =>
    setItems((prev) => prev.map((it) => (it.key === key ? { ...it, ...patch } : it)));

  /** Parse one queued file, then score the parsed candidate against every published job. */
  async function processItem(item: ParseItem, file: File) {
    try {
      const parsed = await parseResume(file);
      patchItem(item.key, { status: "ready", parsed });
      try {
        const matches = await getCandidateMatches(parsed.id);
        patchItem(item.key, { matches });
      } catch {
        patchItem(item.key, { matches: [] }); // scoring is best-effort; card still saves
      }
    } catch (err) {
      patchItem(item.key, { status: "error", error: err instanceof Error ? err.message : "Resume parsing failed." });
    }
  }

  /** Accept 1..N files (bulk), validate, queue them, and parse with limited concurrency. */
  async function handleFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList);
    if (files.length === 0) return;
    const queued: { item: ParseItem; file: File }[] = [];
    const rejected: ParseItem[] = [];
    for (const file of files) {
      const base = { key: nextKey(), fileName: file.name, parsed: null, matches: null } as const;
      if (file.size > MAX_FILE_BYTES) {
        rejected.push({ ...base, status: "error", error: "File is larger than 10 MB." });
      } else {
        queued.push({ item: { ...base, status: "parsing", error: null }, file });
      }
    }
    setItems((prev) => [...prev, ...queued.map((q) => q.item), ...rejected]);

    // Concurrency-limited worker pool so a big drop doesn't fire N parses at once.
    let cursor = 0;
    const worker = async () => {
      while (cursor < queued.length) {
        const { item, file } = queued[cursor++];
        await processItem(item, file);
      }
    };
    await Promise.all(Array.from({ length: Math.min(PARSE_CONCURRENCY, queued.length) }, worker));
  }

  function onInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    // Snapshot to a real array BEFORE clearing the input — event.target.files is a live
    // list that resetting value="" empties, which would otherwise drop the selection.
    const files = Array.from(event.target.files ?? []);
    event.target.value = ""; // allow re-selecting the same file
    if (files.length) handleFiles(files);
  }

  function onDrop(event: React.DragEvent) {
    event.preventDefault();
    if (event.dataTransfer.files?.length) handleFiles(event.dataTransfer.files);
  }

  async function saveItem(key: string) {
    const item = items.find((it) => it.key === key);
    if (!item?.parsed || item.status === "saving" || item.status === "saved") return;
    patchItem(key, { status: "saving" });
    try {
      await saveCandidate(item.parsed);
      patchItem(key, { status: "saved" });
      loadSaved();
    } catch (err) {
      patchItem(key, { status: "error", error: err instanceof Error ? err.message : "Could not save candidate." });
    }
  }

  const saveAll = () => items.filter((it) => it.status === "ready").forEach((it) => saveItem(it.key));
  const removeItem = (key: string) => setItems((prev) => prev.filter((it) => it.key !== key));
  const clearItems = () => setItems([]);

  const parsingCount = items.filter((it) => it.status === "parsing").length;
  const readyCount = items.filter((it) => it.status === "ready").length;
  const isSingle = items.length === 1;

  return (
    <div>
      <PageHeader
        title="Candidates"
        subtitle="Build your talent pipeline by adding and managing candidates."
        actions={
          <button type="button" onClick={browse} className="btn btn-primary">
            <PlusIcon /> Add Candidate
          </button>
        }
      />

      <TabBar
        ariaLabel="Candidate lists"
        items={TABS.map((t) => ({ key: t, label: t }))}
        value={tab}
        onChange={setTab}
      />

      {/* Hidden file input — drop zone / buttons trigger this. `multiple` enables bulk upload. */}
      <input ref={fileInputRef} type="file" accept=".pdf,.docx" multiple className="hidden" onChange={onInputChange} />

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] items-start">
        {/* ── Main column ── */}
        <div className="min-w-0 space-y-6">
          {/* Upload drop zone — click to browse or drag & drop one or many resumes */}
          <div
            role="button"
            tabIndex={0}
            onClick={browse}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); browse(); } }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            className="group card card-ai relative overflow-hidden p-2 cursor-pointer"
          >
            <NeuralMesh />
            <div className="relative rounded-2xl border border-dashed border-brand-200 group-hover:border-brand-400 group-hover:bg-brand-50/40 transition-colors px-6 py-10 sm:py-12 flex flex-col items-center text-center">
              <span aria-hidden="true" className="empty-state-icon w-14 h-14 mb-4"><UploadCloudIcon /></span>
              <span className="ai-chip mb-3"><SparkIcon /> AI resume parsing</span>
              <h2 className="font-display text-title-lg font-extrabold text-ink-900">Upload Candidate Resumes</h2>
              <p className="text-body-sm text-ink-600 mt-1.5">
                Drag &amp; drop files here or <span className="text-brand-700 font-semibold">click to browse</span>
              </p>
              <p className="text-caption text-ink-500 mt-1 max-w-md">Upload multiple resumes at once. We&apos;ll parse and extract candidate details automatically.</p>
              <span className="btn btn-primary mt-5">
                Upload Resumes <ChevronDown />
              </span>
              <p className="text-caption text-ink-500 mt-4">Supports PDF and DOCX (Max 10MB each)</p>
            </div>
          </div>

          {/* Filter bar */}
          <div className="card p-3 sm:p-4 flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-full sm:min-w-60">
              <label htmlFor={searchId} className="sr-only">Search candidates</label>
              <span aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400"><SearchIcon /></span>
              <input id={searchId} type="text" placeholder="Search candidates by name, skills or email..." className="field-input h-10 pl-10 text-body-sm" />
            </div>
            <FilterSelect label="All Status" options={["Shortlisted", "Contacted", "Archived"]} />
            <FilterSelect label="All Skills" options={["JavaScript", "React", "Python", "Java"]} />
            <FilterSelect label="All Experience" options={["0-2 Years", "2-5 Years", "5-10 Years", "10+ Years"]} />
            <FilterSelect label="All Locations" options={["Bangalore", "Chennai", "Hyderabad", "Mumbai", "Remote"]} />
            <button type="button" className="btn btn-outline text-body-sm">
              <FunnelIcon /> More Filters
            </button>
            <div className="ml-auto flex items-center gap-1">
              <button type="button" className="btn btn-ghost text-body-sm">Clear</button>
              <button type="button" disabled className="btn btn-outline text-body-sm">
                Actions <ChevronDown />
              </button>
            </div>
          </div>

          {/* Parse queue: one card per uploaded resume (1 for a single upload, N for bulk) */}
          {items.length > 0 ? (
            <div className="space-y-3">
              {/* Batch toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p role="status" aria-live="polite" className="text-body-sm text-ink-600">
                  {parsingCount > 0
                    ? <>Parsing <span className="font-semibold text-ink-900 tabular">{parsingCount}</span> of {items.length} resume{items.length === 1 ? "" : "s"}…</>
                    : <>Reviewing <span className="font-semibold text-ink-900 tabular">{items.length}</span> candidate{items.length === 1 ? "" : "s"}</>}
                </p>
                <div className="flex items-center gap-2">
                  {readyCount > 1 && (
                    <button type="button" onClick={saveAll} className="btn btn-primary text-body-sm">
                      Save all ({readyCount})
                    </button>
                  )}
                  <button type="button" onClick={clearItems} className="btn btn-outline text-body-sm">
                    Clear
                  </button>
                </div>
              </div>
              {items.map((item) => (
                <ParseCard key={item.key} item={item} defaultExpanded={isSingle} onSave={saveItem} onRemove={removeItem} />
              ))}
            </div>
          ) : savedLoading ? (
            <div role="status" aria-live="polite" className="card p-5 space-y-4">
              <p className="text-body-sm text-ink-500">Loading candidates…</p>
              {[0, 1].map((row) => (
                <div key={row} className="flex items-center gap-3">
                  <Skeleton className="w-11 h-11 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-1/3" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : saved.length > 0 ? (
            <div className="space-y-3">
              {saved.map((candidate) => <SavedCandidateCard key={candidate.id} candidate={candidate} />)}
            </div>
          ) : (
            <EmptyState
              icon={<ClipboardIcon />}
              title={<h2 className="section-title">{EMPTY_COPY[tab].heading}</h2>}
              description={EMPTY_COPY[tab].sub}
              action={
                <button type="button" onClick={browse} className="btn btn-primary">
                  Upload Your First Resume
                </button>
              }
            />
          )}
        </div>

        {/* ── Right rail ── */}
        <aside aria-label="Candidate tools" className="min-w-0 grid gap-6 md:grid-cols-2 lg:grid-cols-1">
          {/* Parsing & Save Options */}
          <AIInsight label="AI parsing" title="Parsing & Save Options">
            <ul className="space-y-4">
              <RailItem icon={<MagicIcon />} title="Auto Parse Resume" desc="Extract candidate information, skills, experience and contact details automatically." />
              <RailItem icon={<EditIcon />} title="Review & Edit" desc="Review parsed data and make changes before saving to your database." />
              <RailItem icon={<SaveIcon />} title="Save Candidates" desc="Add candidates to your database and organize them for future opportunities." />
            </ul>
          </AIInsight>

          {/* Communicate with Candidates */}
          <section className="card p-5">
            <SectionHeader
              as="h3"
              title="Communicate with Candidates"
              subtitle="Stay connected with your candidates via their preferred channels."
              className="mb-3"
            />
            <ul className="space-y-1 -mx-2">
              <CommItem icon={<MailIcon />} title="Send Email" desc="Send personalized emails to one or multiple candidates." onClick={() => setComposeChannel("EMAIL")} />
              <CommItem icon={<ChatIcon />} title="Send SMS" desc="Send SMS messages to candidates' mobile numbers." onClick={() => setComposeChannel("SMS")} />
            </ul>
          </section>
        </aside>
      </div>

      {/* Feature strip */}
      <div className="mt-6 card p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <Feature icon={<UploadIcon />} title="Bulk Upload" desc="Upload multiple resumes at once and save time." />
        <Feature icon={<MagicIcon />} title="Smart Parsing" desc="Our AI extracts key information accurately." />
        <Feature icon={<ListIcon />} title="Organize & Filter" desc="Find the right candidates with powerful filters." />
        <Feature icon={<ChatIcon />} title="Engage Easily" desc="Communicate via email or SMS in one click." />
      </div>

      {/* Compose email / SMS */}
      {composeChannel && (
        <ComposeModal
          channel={composeChannel}
          candidates={saved}
          onClose={() => setComposeChannel(null)}
        />
      )}
    </div>
  );
}

/* ── Job matches — best match up front, the rest behind "view more" ───────── */
function JobMatches({ matches }: { matches: JobMatch[] | null }) {
  const [expanded, setExpanded] = useState(false);
  if (matches === null) return <p className="text-body-sm text-ink-500">Scoring against your jobs…</p>;
  if (matches.length === 0) return <p className="text-body-sm text-ink-500">Post a published job to see this candidate matched against it.</p>;
  const rest = matches.slice(1);
  const shown = expanded ? matches : matches.slice(0, 1);
  return (
    <div>
      <ul className="space-y-2.5">
        {shown.map((m, i) => <MatchRow key={m.jobId} match={m} best={i === 0} />)}
      </ul>
      {rest.length > 0 && (
        <button type="button" onClick={() => setExpanded((v) => !v)} className="mt-2 h-9 text-caption font-semibold text-brand-700 hover:text-brand-800">
          {expanded ? "Show best match only" : `View more — ${rest.length} more job${rest.length === 1 ? "" : "s"}`}
        </button>
      )}
    </div>
  );
}

function MatchRow({ match, best }: { match: JobMatch; best?: boolean }) {
  const pct = match.score ?? 0;
  return (
    <li className="flex items-center gap-3">
      <span className="text-body-sm text-ink-800 flex-1 min-w-0 flex items-center gap-2" title={match.jobTitle ?? ""}>
        {best && <span className="badge badge-brand h-5 px-1.5 text-nano tracking-wide shrink-0">BEST</span>}
        <span className="truncate">{match.jobTitle ?? "Untitled job"}</span>
      </span>
      <div className="w-20 sm:w-28 h-1.5 rounded-full bg-ink-100 overflow-hidden shrink-0">
        <div className={`h-full rounded-full ${scoreBar(pct)}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-caption font-bold text-ink-900 w-10 text-right shrink-0 tabular">{match.score != null ? `${pct}%` : "—"}</span>
    </li>
  );
}

/* ── Parse card — one uploaded resume through its lifecycle (parsing → save) ─ */
function ParseCard({
  item,
  defaultExpanded,
  onSave,
  onRemove,
}: {
  item: ParseItem;
  defaultExpanded: boolean;
  onSave: (key: string) => void;
  onRemove: (key: string) => void;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  if (item.status === "parsing") {
    return (
      <div className="card card-ai relative overflow-hidden p-8 sm:p-10 flex flex-col items-center text-center">
        <NeuralMesh />
        <span aria-hidden="true" className="relative w-14 h-14 rounded-full bg-brand-50 text-brand-600 grid place-items-center mb-4 animate-spin"><SpinnerIcon /></span>
        <h2 className="relative section-title text-title">Parsing your resume…</h2>
        <p className="relative text-body-sm text-ink-500 mt-1.5 max-w-md leading-relaxed">
          <span className="font-semibold text-ink-800">{item.fileName}</span> — our AI is extracting skills, experience, education and contact details. This usually takes a few seconds.
        </p>
        <Skeleton className="relative mt-5 w-full max-w-72 h-1.5 rounded-full" />
      </div>
    );
  }
  if (item.status === "error" || !item.parsed) {
    return (
      <div className="card p-4 flex items-center gap-3">
        <span aria-hidden="true" className="icon-tile bg-danger/10 text-danger"><AlertIcon /></span>
        <div className="min-w-0 flex-1">
          <div className="text-body font-semibold text-ink-900 truncate">{item.fileName}</div>
          <div role="alert" className="text-caption text-danger">{item.error ?? "Could not parse this resume."}</div>
        </div>
        <button type="button" onClick={() => onRemove(item.key)} className="btn btn-ghost text-body-sm shrink-0">Remove</button>
      </div>
    );
  }

  const parsed = item.parsed;
  const saved = item.status === "saved";
  const saving = item.status === "saving";
  const initials = (parsed.full_name || "?").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className={`card p-5 space-y-4 ${saved ? "card-success" : ""}`}>
      {/* Header */}
      <div className="flex flex-wrap sm:flex-nowrap items-start gap-3">
        <span aria-hidden="true" className="w-12 h-12 rounded-full bg-brand-50 text-brand-700 grid place-items-center text-body-lg font-bold shrink-0">{initials}</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="section-title">{parsed.full_name || "Unnamed candidate"}</h2>
            {saved && <span className="badge badge-success"><CheckIcon /> Saved</span>}
          </div>
          {parsed.headline && <p className="text-body-sm text-ink-600">{parsed.headline}</p>}
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-caption text-ink-500">
            {parsed.email && <span className="inline-flex items-center gap-1.5 min-w-0 break-all"><MailIcon /> {parsed.email}</span>}
            {parsed.phone && <span className="inline-flex items-center gap-1.5 tabular"><PhoneIcon /> {parsed.phone}</span>}
            {parsed.location && <span className="inline-flex items-center gap-1.5"><PinIcon /> {parsed.location}</span>}
          </div>
          <div className="text-caption text-ink-400 mt-1 truncate">from {item.fileName}</div>
        </div>
        <div className="shrink-0 ml-auto">
          {saved ? (
            <button type="button" onClick={() => onRemove(item.key)} className="btn btn-outline text-body-sm">Dismiss</button>
          ) : (
            <button type="button" onClick={() => onSave(item.key)} disabled={saving} className="btn btn-primary text-body-sm">{saving ? "Saving…" : "Save"}</button>
          )}
        </div>
      </div>

      {/* Job matches — best match up front */}
      <div className="surface-muted p-4">
        <h4 className="text-micro font-bold text-ink-500 uppercase tracking-wider mb-2.5">Job matches</h4>
        <JobMatches matches={item.matches} />
      </div>

      {/* Parsed details (collapsible) */}
      <div>
        <button type="button" onClick={() => setExpanded((v) => !v)} aria-expanded={expanded} className="inline-flex items-center gap-1.5 h-9 text-body-sm font-semibold text-brand-700 hover:text-brand-800">
          {expanded ? "Hide parsed details" : "View parsed details"}
          <span aria-hidden="true" className={`transition-transform ${expanded ? "rotate-180" : ""}`}><ChevronDown /></span>
        </button>
        {expanded && <div className="mt-3 pt-4 border-t border-ink-100"><ParsedProfileDetail parsed={parsed} /></div>}
      </div>
    </div>
  );
}

/* ── Parsed profile detail — skills, experience, education, certs, languages ─ */
function ParsedProfileDetail({ parsed }: { parsed: ParsedCandidate }) {
  return (
    <div className="space-y-5">

      {/* Skills */}
      {parsed.skills.length > 0 && (
        <Section title={`Skills (${parsed.skills.length})`}>
          <div className="flex flex-wrap gap-1.5">
            {parsed.skills.map((skill, i) => (
              <span key={`${skill}-${i}`} className="badge badge-neutral">{skill}</span>
            ))}
          </div>
        </Section>
      )}

      {/* Experience */}
      {parsed.experience.length > 0 && (
        <Section title={`Experience (${parsed.experience.length})`}>
          <ul className="space-y-3">
            {parsed.experience.map((exp, i) => (
              <li key={i} className="flex items-start gap-3">
                <span aria-hidden="true" className="icon-tile icon-tile-sm bg-ink-100 text-ink-600 text-caption font-bold">{(exp.company || "?").charAt(0).toUpperCase()}</span>
                <div className="min-w-0">
                  <div className="text-body-sm font-semibold text-ink-900">{exp.title || "—"}</div>
                  <div className="text-caption text-ink-500">{exp.company || "—"}{dateRange(exp.start_date, exp.end_date, exp.is_current)}</div>
                </div>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Education */}
      {parsed.education.length > 0 && (
        <Section title={`Education (${parsed.education.length})`}>
          <ul className="space-y-2">
            {parsed.education.map((edu, i) => (
              <li key={i} className="text-body-sm">
                <span className="font-semibold text-ink-900">{edu.degree || edu.field || "—"}</span>
                <span className="text-ink-500"> · {edu.institution || "—"}{dateRange(edu.start_date, edu.end_date, false)}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Certifications + languages */}
      {parsed.certifications.length > 0 && (
        <Section title={`Certifications (${parsed.certifications.length})`}>
          <ul className="space-y-1 text-body-sm text-ink-700">
            {parsed.certifications.map((cert, i) => (
              <li key={i}>{cert.name || "—"}{cert.issuer ? ` · ${cert.issuer}` : ""}</li>
            ))}
          </ul>
        </Section>
      )}
      {parsed.languages.length > 0 && (
        <Section title="Languages">
          <div className="flex flex-wrap gap-1.5">
            {parsed.languages.map((lang, i) => (
              <span key={i} className="badge badge-neutral">{lang.language}{lang.proficiency ? ` (${lang.proficiency})` : ""}</span>
            ))}
          </div>
        </Section>
      )}

    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-micro font-bold text-ink-500 uppercase tracking-wider mb-2">{title}</h3>
      {children}
    </div>
  );
}

/** "Jan 2021 – Present" style range, prefixed with " · " when non-empty. */
function dateRange(start: string | null, end: string | null, current: boolean | null): string {
  const from = start ? String(start).slice(0, 7) : "";
  const to = current ? "Present" : end ? String(end).slice(0, 7) : "";
  if (!from && !to) return "";
  return ` · ${[from, to].filter(Boolean).join(" – ")}`;
}

/* ── Saved candidate card — shows match scores against every job ──────── */
/** Bar tone for a 0–100 score — the same tiers as <MatchScore>. */
function scoreBar(pct: number) {
  if (pct >= 80) return "bg-success";
  if (pct >= 60) return "bg-brand-500";
  if (pct >= 40) return "bg-warn";
  return "bg-ink-300";
}
function SavedCandidateCard({ candidate }: { candidate: SavedCandidate }) {
  const name = candidate.fullName || "Unnamed Candidate";
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const meta = [candidate.headline, candidate.location, candidate.experienceYears != null ? `${candidate.experienceYears} yrs` : null].filter(Boolean).join(" · ");
  return (
    <div className="card p-5">
      <div className="flex items-start gap-3">
        <span aria-hidden="true" className="w-11 h-11 rounded-full bg-brand-50 text-brand-700 grid place-items-center text-body font-bold shrink-0">{initials}</span>
        <div className="min-w-0 flex-1">
          <div className="section-title">{name}</div>
          {meta && <div className="text-caption text-ink-600 mt-0.5">{meta}</div>}
          {candidate.email && <div className="text-caption text-ink-500 break-all">{candidate.email}</div>}
          {candidate.skills.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {candidate.skills.slice(0, 8).map((skill, i) => <span key={`${skill}-${i}`} className="badge badge-neutral">{skill}</span>)}
              {candidate.skills.length > 8 && <span className="badge badge-neutral">+{candidate.skills.length - 8}</span>}
            </div>
          )}
        </div>
        {candidate.bestScore != null && (
          <MatchScore value={candidate.bestScore} size="sm" label="Best match" caption={<span className="text-micro">Best match</span>} className="shrink-0" />
        )}
      </div>

      {/* Job matches — best match up front, rest behind "view more" */}
      <div className="mt-4 surface-muted p-4">
        <h4 className="text-micro font-bold text-ink-500 uppercase tracking-wider mb-2.5">Job matches</h4>
        <JobMatches matches={candidate.matches} />
      </div>
    </div>
  );
}

/* ── Pieces ───────────────────────────────────────────────────────────── */
function FilterSelect({ label, options }: { label: string; options: string[] }) {
  return (
    <div className="relative inline-flex items-center">
      <select aria-label={label} className="field-input h-10 w-auto appearance-none pl-3 pr-9 text-body-sm text-ink-700 cursor-pointer" defaultValue="">
        <option value="">{label}</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <span aria-hidden="true" className="absolute right-3 text-ink-400 pointer-events-none"><ChevronDown /></span>
    </div>
  );
}

function RailItem({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <li className="flex items-start gap-3">
      <span aria-hidden="true" className="icon-tile icon-tile-sm bg-white text-brand-600 border border-brand-100">{icon}</span>
      <div className="min-w-0">
        <div className="text-body-sm font-semibold text-ink-900">{title}</div>
        <div className="text-caption text-ink-500 leading-relaxed mt-0.5">{desc}</div>
      </div>
    </li>
  );
}

function CommItem({ icon, title, desc, onClick }: { icon: React.ReactNode; title: string; desc: string; onClick?: () => void }) {
  return (
    <li>
      <button type="button" onClick={onClick} className="group w-full flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-ink-100 transition-colors text-left">
        <span aria-hidden="true" className="icon-tile icon-tile-sm bg-brand-50 text-brand-600">{icon}</span>
        <div className="min-w-0 flex-1">
          <div className="text-body-sm font-semibold text-ink-900">{title}</div>
          <div className="text-caption text-ink-500 leading-relaxed mt-0.5">{desc}</div>
        </div>
        <span aria-hidden="true" className="text-ink-400 group-hover:text-brand-600 group-hover:translate-x-0.5 transition shrink-0"><ArrowRight /></span>
      </button>
    </li>
  );
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3">
      <span aria-hidden="true" className="icon-tile bg-brand-50 text-brand-600">{icon}</span>
      <div className="min-w-0">
        <div className="text-body-sm font-semibold text-ink-900">{title}</div>
        <div className="text-caption text-ink-500 leading-relaxed mt-0.5">{desc}</div>
      </div>
    </div>
  );
}

/* ── Compose email / SMS to saved candidates ─────────────────────────────── */
function ComposeModal({
  channel,
  candidates,
  onClose,
}: {
  channel: MessageChannel;
  candidates: SavedCandidate[];
  onClose: () => void;
}) {
  const isEmail = channel === "EMAIL";
  const contactOf = (c: SavedCandidate) => (isEmail ? c.email : c.phone);
  const reachable = candidates.filter((c) => !!contactOf(c));

  const [selected, setSelected] = useState<Set<string>>(() => new Set(reachable.map((c) => c.id)));
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SendMessageResult | null>(null);
  const titleId = useId();
  const subjectId = useId();
  const bodyId = useId();
  const errorId = useId();

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const allSelected = reachable.length > 0 && reachable.every((c) => selected.has(c.id));
  const toggleAll = () =>
    setSelected(allSelected ? new Set() : new Set(reachable.map((c) => c.id)));

  const canSend = selected.size > 0 && body.trim().length > 0 && !sending;

  async function handleSend() {
    if (!canSend) return;
    setSending(true);
    setError(null);
    setResult(null);
    try {
      const res = await sendMessage({
        channel,
        candidateIds: [...selected],
        subject: isEmail ? subject : undefined,
        body,
      });
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send the message.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="modal-panel max-w-140 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span aria-hidden="true" className="icon-tile bg-brand-50 text-brand-600">
              {isEmail ? <MailIcon /> : <ChatIcon />}
            </span>
            <div>
              <h2 id={titleId} className="section-title text-title">{isEmail ? "Send Email" : "Send SMS"}</h2>
              <p className="text-caption text-ink-500 mt-0.5">
                {isEmail ? "Send a personalized email to selected candidates." : "Text selected candidates on their mobile."}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="btn btn-ghost btn-icon -mr-2 -mt-1">
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
          </button>
        </div>

        {/* Result view */}
        {result ? (
          <div className="mt-5">
            <div role="status" className={`alert flex-col gap-1 ${result.failed === 0 ? "alert-success" : "alert-warn"}`}>
              <p className="text-body font-semibold text-ink-900">
                {result.sent} sent{result.failed > 0 ? `, ${result.failed} failed` : ""}
              </p>
              {result.failed > 0 && (
                <ul className="mt-1 space-y-1 text-caption text-ink-600">
                  {result.results.filter((r) => !r.sent).map((r) => (
                    <li key={r.candidateId}>• {r.recipient ?? "no contact"} — {r.error}</li>
                  ))}
                </ul>
              )}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setResult(null)} className="btn btn-outline">Send Another</button>
              <button type="button" onClick={onClose} className="btn btn-primary">Done</button>
            </div>
          </div>
        ) : candidates.length === 0 ? (
          <div className="mt-6 text-center py-8">
            <p className="text-body text-ink-500">Save some candidates to your talent pool first, then you can message them here.</p>
            <button type="button" onClick={onClose} className="btn btn-outline mt-4">Close</button>
          </div>
        ) : (
          <>
            {/* Recipients */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="field-label mb-0">Recipients <span className="text-ink-500 tabular">({selected.size})</span></span>
                <button type="button" onClick={toggleAll} className="h-9 text-caption font-semibold text-brand-700 hover:text-brand-800">
                  {allSelected ? "Clear all" : "Select all"}
                </button>
              </div>
              <div className="border border-ink-200 rounded-xl divide-y divide-ink-100 max-h-50 overflow-y-auto">
                {candidates.map((c) => {
                  const contact = contactOf(c);
                  const disabled = !contact;
                  return (
                    <label key={c.id} className={`flex items-center gap-3 px-3 py-2.5 min-h-12 ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-ink-50"}`}>
                      <input
                        type="checkbox"
                        disabled={disabled}
                        checked={selected.has(c.id)}
                        onChange={() => toggle(c.id)}
                        className="w-4 h-4 accent-brand-600 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-body-sm font-semibold text-ink-900 truncate">{c.fullName || "Unnamed candidate"}</div>
                        <div className="text-caption text-ink-500 truncate">{contact || `No ${isEmail ? "email" : "phone"} on file`}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Subject (email only) */}
            {isEmail && (
              <div className="mt-4">
                <label htmlFor={subjectId} className="field-label">Subject</label>
                <input
                  id={subjectId}
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. An opportunity that matches your profile"
                  className="field-input"
                />
              </div>
            )}

            {/* Body */}
            <div className="mt-4">
              <label htmlFor={bodyId} className="field-label">Message</label>
              <textarea
                id={bodyId}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={isEmail ? 6 : 4}
                placeholder={isEmail ? "Hi {{firstName}},\n\nWe came across your profile and…" : "Hi {{firstName}}, we'd love to connect about a role…"}
                aria-describedby={error ? errorId : undefined}
                className="field-input resize-none"
              />
              <p className="field-hint">
                Use <span className="font-mono text-ink-600">{"{{firstName}}"}</span> or <span className="font-mono text-ink-600">{"{{name}}"}</span> to personalize.
                {!isEmail && ` ${body.length} characters.`}
              </p>
            </div>

            {error && <p id={errorId} role="alert" className="field-error">{error}</p>}

            {/* Actions */}
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={onClose} className="btn btn-outline">Cancel</button>
              <button
                type="button"
                onClick={handleSend}
                disabled={!canSend}
                className="btn btn-primary"
              >
                {sending ? "Sending…" : `Send ${isEmail ? "Email" : "SMS"}`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ── Icons ────────────────────────────────────────────────────────────── */
function PlusIcon() { return (<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></svg>); }
function SparkIcon() { return (<svg aria-hidden="true" width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.9 6.1L20 10l-6.1 1.9L12 18l-1.9-6.1L4 10l6.1-1.9z" /></svg>); }
function UploadCloudIcon() { return (<svg aria-hidden="true" width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M7 18a4 4 0 0 1-.5-7.97A6 6 0 0 1 18 9.5a3.5 3.5 0 0 1 .5 6.97" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/><path d="M12 12v7M9 14.5l3-3 3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>); }
function ClipboardIcon() { return (<svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="6" y="4" width="9" height="16" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><path d="M9 4V3h3v1" stroke="currentColor" strokeWidth="1.4"/><circle cx="17.5" cy="9.5" r="2" stroke="currentColor" strokeWidth="1.4"/><path d="M14.5 16c0-1.7 1.3-3 3-3s3 1.3 3 3" stroke="currentColor" strokeWidth="1.4"/></svg>); }
function SearchIcon() { return (<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>); }
function FunnelIcon() { return (<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" /></svg>); }
function ChevronDown() { return (<svg aria-hidden="true" width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>); }
function ArrowRight() { return (<svg aria-hidden="true" width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M3 8h10m0 0L8 3m5 5l-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>); }
function MagicIcon() { return (<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 3v4M3 5h4M19 17v4M17 19h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/><path d="M13 4l2 4 4 2-4 2-2 4-2-4-4-2 4-2 2-4z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/></svg>); }
function EditIcon() { return (<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M4 20h4l10-10a2 2 0 0 0-3-3L5 17v3z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/><path d="M13.5 6.5l3 3" stroke="currentColor" strokeWidth="1.6"/></svg>); }
function SaveIcon() { return (<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 4h11l3 3v13H5V4z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/><path d="M8 4v5h7M8 14h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>); }
function MailIcon() { return (<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.6"/><path d="M4 7l8 6 8-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>); }
function ChatIcon() { return (<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M4 5h16v11H8l-4 4V5z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/></svg>); }
function UploadIcon() { return (<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 3v12M8 7l4-4 4 4M5 21h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>); }
function ListIcon() { return (<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>); }
function SpinnerIcon() { return (<svg aria-hidden="true" width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M12 3a9 9 0 1 0 9 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>); }
function AlertIcon() { return (<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>); }
function CheckIcon() { return (<svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg>); }
function PhoneIcon() { return (<svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.4-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>); }
function PinIcon() { return (<svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M21 10c0 7-9 12-9 12s-9-5-9-12a9 9 0 0 1 18 0z" stroke="currentColor" strokeWidth="1.6"/><circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="1.6"/></svg>); }
