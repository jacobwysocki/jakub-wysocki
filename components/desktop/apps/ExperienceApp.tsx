"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight, Briefcase, MapPin, Palette } from "lucide-react";
import {
  engineeringRoles,
  studioNote,
  roleMatchesFilter,
  TECH_FILTERS,
  type Role,
} from "@/data/experience";
import { ui } from "@/data/ui";
import { useT } from "@/lib/lang-store";
import { useDesktop } from "@/components/desktop/DesktopContext";
import { EASE_APPLE } from "@/lib/motion";

const ALL_ROLES: Role[] = [...engineeringRoles, studioNote];

/** Wiersz źródłowej listy w duchu Findera: ikona, nazwa, lata po prawej. */
function SidebarRow({
  role,
  selected,
  dimmed,
  onSelect,
}: {
  role: Role;
  selected: boolean;
  dimmed: boolean;
  onSelect: () => void;
}) {
  const t = useT();
  const isStudio = role.id === "ultrastudio";
  const years = t(role.period).replace(/\s/g, "").split("—");
  const yearLabel = `${years[0]?.slice(-4) ?? ""}–${years[1]?.slice(-2) ?? ""}`;

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={selected || undefined}
      className={`flex w-full items-center gap-2 rounded-[7px] px-2 py-[5px] text-left transition-all duration-200 ${
        selected ? "bg-accent text-white" : "text-ink hover:bg-black/[0.05]"
      } ${dimmed && !selected ? "opacity-40" : ""}`}
    >
      {isStudio ? (
        <Palette
          size={14}
          strokeWidth={1.9}
          aria-hidden
          className={selected ? "text-white" : "text-[#BF5AF2]"}
        />
      ) : (
        <Briefcase
          size={14}
          strokeWidth={1.9}
          aria-hidden
          className={selected ? "text-white" : "text-accent"}
        />
      )}
      <span className="min-w-0 flex-1 truncate text-[13px] font-medium">
        {role.company}
      </span>
      <span
        className={`shrink-0 text-[10.5px] tabular-nums ${
          selected ? "text-white/90" : "text-muted"
        }`}
      >
        {yearLabel}
      </span>
    </button>
  );
}

/** Panel detalu wybranej roli — jedna firma na ekran, jak karta w CV. */
function RoleDetail({ role }: { role: Role }) {
  const t = useT();
  const { openApp } = useDesktop();
  const isStudio = role.id === "ultrastudio";

  return (
    <motion.div
      key={role.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [...EASE_APPLE] }}
      className="px-8 py-7"
    >
      <p className="text-[12px] font-medium uppercase tracking-[0.06em] text-muted">
        {t(role.period)}
      </p>
      <h1 className="mt-1.5 text-[21px] font-bold tracking-tight text-ink">
        {role.company}
      </h1>
      <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[14px] font-medium text-ink/70">
        {t(role.role)}
        <span className="flex items-center gap-1 text-[12px] font-normal text-muted">
          <MapPin size={11.5} strokeWidth={2} aria-hidden />
          {t(role.location)}
        </span>
      </p>

      <p className="mt-4 max-w-[58ch] text-[15px] font-medium leading-relaxed text-ink/85">
        {t(role.summary)}
      </p>

      <ul className="mt-4 max-w-[60ch] space-y-2.5">
        {role.highlights.map((highlight, i) => (
          <li key={i} className="flex gap-2.5 text-[13.5px] leading-relaxed text-ink/75">
            <span
              aria-hidden
              className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-accent"
            />
            {t(highlight)}
          </li>
        ))}
      </ul>

      <div className="mt-6 border-t border-line/60 pt-5">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.07em] text-muted">
          {t(ui.desktop.techStack)}
        </h2>
        <ul className="mt-2.5 flex flex-wrap gap-1.5">
          {role.tech.map((item) => (
            <li
              key={item}
              className="rounded-full border border-line bg-white px-2.5 py-0.5 text-[11px] font-medium text-ink/70"
            >
              {item}
            </li>
          ))}
        </ul>
      </div>

      {isStudio && (
        <button
          type="button"
          onClick={() => openApp("studio")}
          className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-ink/90"
        >
          Ultra Studio
          <ArrowUpRight size={14} aria-hidden />
        </button>
      )}
    </motion.div>
  );
}

/**
 * Doświadczenie — okno w duchu Findera: sidebar źródłowy (firmy + filtry
 * technologii, które przygaszają niepasujące pozycje zamiast je chować)
 * i panel detalu jednej roli. Strzałki ↑/↓ przełączają firmy.
 * Poniżej ~560 px szerokości okna sidebar składa się do paska segmentów.
 */
export default function ExperienceApp() {
  const t = useT();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [selectedId, setSelectedId] = useState(ALL_ROLES[0].id);
  const [filters, setFilters] = useState<string[]>([]);
  const [narrow, setNarrow] = useState(false);

  const selected = ALL_ROLES.find((r) => r.id === selectedId) ?? ALL_ROLES[0];

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      setNarrow(entry.contentRect.width < 560);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const toggleFilter = (filter: string) =>
    setFilters((current) =>
      current.includes(filter)
        ? current.filter((f) => f !== filter)
        : [...current, filter]
    );

  const isDimmed = (role: Role) =>
    filters.length > 0 && !filters.every((f) => roleMatchesFilter(role, f));

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const index = ALL_ROLES.findIndex((r) => r.id === selectedId);
    const next = e.key === "ArrowDown" ? index + 1 : index - 1;
    if (next >= 0 && next < ALL_ROLES.length) setSelectedId(ALL_ROLES[next].id);
  };

  if (narrow) {
    return (
      <div ref={rootRef} className="flex h-full flex-col" onKeyDown={onKeyDown}>
        {/* Wąskie okno: firmy jako przewijany pasek segmentów */}
        <div className="flex shrink-0 gap-1 overflow-x-auto border-b border-black/[0.06] px-3 py-2">
          {ALL_ROLES.map((role) => (
            <button
              key={role.id}
              type="button"
              onClick={() => setSelectedId(role.id)}
              className={`shrink-0 rounded-full px-3 py-1 text-[12px] font-semibold transition-colors ${
                selectedId === role.id
                  ? "bg-accent text-white"
                  : "bg-black/[0.05] text-ink/70 hover:text-ink"
              }`}
            >
              {role.company}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <RoleDetail role={selected} />
          </AnimatePresence>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={rootRef}
      className="flex h-full outline-none"
      tabIndex={0}
      onKeyDown={onKeyDown}
    >
      {/* Sidebar źródłowy — vibrancy jak w Finderze */}
      <aside className="flex w-[208px] shrink-0 flex-col gap-4 overflow-y-auto border-r border-black/[0.07] bg-[#E9E9EC]/55 px-2.5 py-3 backdrop-blur-xl">
        <div>
          <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-[0.05em] text-muted">
            {t(ui.desktop.roles)}
          </p>
          <div className="space-y-px">
            {engineeringRoles.map((role) => (
              <SidebarRow
                key={role.id}
                role={role}
                selected={selectedId === role.id}
                dimmed={isDimmed(role)}
                onSelect={() => setSelectedId(role.id)}
              />
            ))}
          </div>
          <p className="mt-3 px-2 pb-1 text-[11px] font-semibold uppercase tracking-[0.05em] text-muted">
            {t(ui.desktop.creativeVenture)}
          </p>
          <SidebarRow
            role={studioNote}
            selected={selectedId === studioNote.id}
            dimmed={isDimmed(studioNote)}
            onSelect={() => setSelectedId(studioNote.id)}
          />
        </div>

        <div>
          <p className="px-2 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.05em] text-muted">
            {t(ui.desktop.filterByTech)}
          </p>
          <div className="flex flex-wrap gap-1 px-1">
            {TECH_FILTERS.map((filter) => {
              const active = filters.includes(filter);
              return (
                <button
                  key={filter}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggleFilter(filter)}
                  className={`rounded-full px-2 py-[3px] text-[11px] font-semibold transition-colors ${
                    active
                      ? "bg-accent text-white"
                      : "bg-black/[0.06] text-ink/65 hover:bg-black/[0.1] hover:text-ink"
                  }`}
                >
                  {filter}
                </button>
              );
            })}
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <RoleDetail role={selected} />
        </AnimatePresence>
      </div>
    </div>
  );
}
