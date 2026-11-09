"use client";

import { useState, useEffect } from "react";
import { fetchSkills } from "../../../services/candidate.service";
import type { Skill } from "../../../types/auth.types";
import { POPULAR_SKILLS, POPULAR_SKILL_COLORS, PROFICIENCY_LEVELS, SKILL_PALETTE, SOFT_SKILL_CATEGORIES } from "../shared/constants";
import { DotsIndicator, FieldError } from "../shared/ui";
import { SearchIcon, TrashSmIcon, SpinnerIcon } from "../shared/icons";

function colorForIndex(index: number): string {
  return SKILL_PALETTE[index % SKILL_PALETTE.length];
}

function getAddedSkillColor(name: string): string {
  return POPULAR_SKILL_COLORS[name] ?? "#6366f1";
}

interface CatalogEntry { name: string; color: string; category: string; }
interface SearchResult { id: string; name: string; category: string; }

interface Props {
  selectedName: string;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  searchResults: SearchResult[];
  onSelect: (name: string, color: string) => void;
  addedSkills: Skill[];
  onDeleteRequest: (id: string, name: string) => void;
  nameError?: string;
}

const isSoft = (category: string) => SOFT_SKILL_CATEGORIES.has(category);

export default function SkillLeftPanel({
  selectedName, searchQuery, onSearchChange, searchResults,
  onSelect, addedSkills, onDeleteRequest, nameError,
}: Props) {
  const [allSkills, setAllSkills] = useState<CatalogEntry[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [showAll,   setShowAll]   = useState(false);

  useEffect(() => {
    fetchSkills()
      .then(items => {
        setAllSkills(items.length > 0
          ? items.map((item, i) => ({ name: item.name, color: colorForIndex(i), category: item.category ?? "" }))
          : POPULAR_SKILLS.map(s => ({ ...s, category: "" })));
      })
      .catch(() => setAllSkills(POPULAR_SKILLS.map(s => ({ ...s, category: "" }))))
      .finally(() => setLoading(false));
  }, []);

  const technical = allSkills.filter(s => !isSoft(s.category));
  const soft      = allSkills.filter(s => isSoft(s.category));

  // Custom skill: typed text that isn't already an exact catalog / search match.
  const trimmed = searchQuery.trim();
  const hasExact = [...allSkills, ...searchResults].some(s => s.name.toLowerCase() === trimmed.toLowerCase());
  const showCustomAdd = trimmed.length > 0 && !hasExact;

  const renderChip = (skill: CatalogEntry) => (
    <button key={skill.name} type="button" onClick={() => onSelect(skill.name, skill.color)}
      aria-pressed={selectedName === skill.name}
      className={`flex items-center justify-between gap-1 min-h-9 px-2.5 rounded-lg border text-caption font-medium transition-colors ${
        selectedName === skill.name
          ? "border-brand-400 bg-brand-50 text-brand-800"
          : "border-ink-200 bg-white text-ink-700 hover:border-brand-300 hover:bg-brand-50/60"
      }`}>
      <span className="flex items-center gap-1.5 min-w-0">
        <span aria-hidden="true" className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: skill.color }} />
        <span className="truncate">{skill.name}</span>
      </span>
      <span aria-hidden="true" className="text-brand-500 font-bold text-body-sm shrink-0">+</span>
    </button>
  );

  const section = (title: string, list: CatalogEntry[]) => {
    if (list.length === 0) return null;
    const shown = showAll ? list : list.slice(0, 6);
    return (
      <div>
        <div className="text-micro font-bold text-ink-500 uppercase tracking-wider mb-2">{title}</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-1.5">{shown.map(renderChip)}</div>
      </div>
    );
  };

  return (
    <div className="w-full md:w-[340px] shrink-0 border-b md:border-b-0 md:border-r border-ink-200/70 bg-ink-50/50 md:overflow-y-auto p-5 sm:p-6 space-y-5">

      <div className="flex items-center gap-2.5">
        <span className="grid place-items-center w-6 h-6 rounded-full bg-[image:var(--gradient-brand)] text-white text-caption font-bold shrink-0">1</span>
        <h3 className="section-title">Search or Select Skill</h3>
      </div>

      {/* Search (also lets you add any custom skill) */}
      <div>
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none"><SearchIcon /></span>
          <input value={searchQuery} onChange={e => onSearchChange(e.target.value)}
            placeholder="Search or type any skill (e.g., Project Manager)"
            aria-label="Search skills"
            aria-invalid={nameError ? true : undefined}
            aria-describedby={nameError ? "skill-name-error" : undefined}
            className={`field-input pl-10 text-body-sm ${nameError ? "border-danger/70" : ""}`} />
          {(searchResults.length > 0 || showCustomAdd) && (
            <ul className="absolute z-20 left-0 right-0 mt-1 p-1 bg-white rounded-xl border border-ink-200/70 shadow-elevated max-h-48 overflow-y-auto">
              {searchResults.map(s => (
                <li key={s.id}>
                  <button type="button" onMouseDown={() => onSelect(s.name, "#6366f1")}
                    className="w-full text-left px-3 py-2 rounded-lg text-body-sm text-ink-700 hover:bg-brand-50 hover:text-brand-700 transition-colors">
                    {s.name}
                    {s.category && <span className="text-micro text-ink-400 ml-2">{s.category}</span>}
                  </button>
                </li>
              ))}
              {showCustomAdd && (
                <li>
                  <button type="button" onMouseDown={() => onSelect(trimmed, "#6366f1")}
                    className="w-full text-left px-3 py-2 rounded-lg text-body-sm text-brand-700 font-semibold hover:bg-brand-50 transition-colors">
                    + Add &ldquo;{trimmed}&rdquo; as a custom skill
                  </button>
                </li>
              )}
            </ul>
          )}
        </div>
        <FieldError id="skill-name-error">{nameError}</FieldError>
      </div>

      {loading ? (
        <div role="status" className="flex items-center justify-center py-4 text-ink-400">
          <SpinnerIcon />
          <span className="ml-2 text-caption">Loading skills…</span>
        </div>
      ) : (
        <>
          {section("Technical Skills", technical)}
          {section("Soft Skills", soft)}
          {(technical.length > 6 || soft.length > 6) && (
            <button type="button" onClick={() => setShowAll(s => !s)} aria-expanded={showAll}
              className="btn btn-ghost btn-sm -ml-3 text-brand-700">
              {showAll ? "View Less ▲" : "View More ▼"}
            </button>
          )}
        </>
      )}

      {/* Added Skills list */}
      {addedSkills.length > 0 && (
        <div className="pt-4 border-t border-ink-200/70">
          <div className="text-micro font-bold text-ink-500 uppercase tracking-wider mb-2">
            Your Added Skills <span className="tabular">({addedSkills.length})</span>
          </div>
          <ul className="space-y-1.5">
            {addedSkills.map(s => {
              const dotsFilled = PROFICIENCY_LEVELS.find(p => p.label === s.proficiency)?.dots ?? 0;
              return (
                <li key={s.id} className="flex items-center gap-2 pl-2.5 pr-1 py-1 rounded-xl border border-ink-200/70 bg-white">
                  <span aria-hidden="true" className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: getAddedSkillColor(s.name) }} />
                  <span className="flex-1 text-caption font-semibold text-ink-800 truncate">{s.name}</span>
                  <DotsIndicator filled={dotsFilled} size={6} />
                  <span className="text-nano text-ink-500 w-[68px] shrink-0">{s.proficiency}</span>
                  {s.highlighted && (
                    <span className="badge badge-warn h-5 px-1.5 text-nano">
                      ⭐ Top
                    </span>
                  )}
                  <button type="button" onClick={() => onDeleteRequest(s.id, s.name)} aria-label={`Delete ${s.name}`}
                    className="grid place-items-center w-8 h-8 rounded-lg text-ink-400 hover:text-danger hover:bg-danger/10 transition-colors shrink-0">
                    <TrashSmIcon />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
