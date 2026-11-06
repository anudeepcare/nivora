"use client";
import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import s from "./SearchableSelect.module.css";
export default function SearchableSelect({
  label,
  value,
  options,
  onChange,
  disabled = false,
  placeholder = "Choose an option",
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false),
    [query, setQuery] = useState("");
  const root = useRef<HTMLDivElement>(null),
    id = useId();
  const current = options.find((x) => x.value === value);
  const filtered = options.filter((x) =>
    `${x.label} ${x.value}`.toLowerCase().includes(query.toLowerCase()),
  );
  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);
  useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled]);
  function close() {
    setOpen(false);
    root.current?.querySelector("button")?.focus();
  }
  return (
    <div
      className={s.root}
      ref={root}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpen(false);
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          close();
        }
      }}
    >
      <span className={s.label} id={id}>
        {label}
      </span>
      <button
        type="button"
        className={s.trigger}
        aria-labelledby={`${id} ${id}-value`}
        aria-expanded={open}
        aria-controls={`${id}-popup`}
        aria-haspopup="listbox"
        disabled={disabled}
        onClick={() => {
          setQuery("");
          setOpen(!open);
        }}
      >
        <span id={`${id}-value`}>{current?.label ?? placeholder}</span>
        <ChevronDown size={16} />
      </button>
      {open && (
        <div className={s.popup} id={`${id}-popup`}>
          <label>
            <Search size={15} />
            <input
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  root.current?.querySelector("select")?.focus();
                }
              }}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label={`Search ${label.toLowerCase()}`}
              placeholder="Type to filter…"
            />
          </label>
          {filtered.length ? (
            <select
              aria-label={`${label} choices`}
              size={Math.min(7, Math.max(2, filtered.length))}
              value={filtered.some((x) => x.value === value) ? value : ""}
              onChange={(e) => {
                onChange(e.target.value);
                close();
              }}
            >
              <option value="" disabled hidden>
                Choose an option
              </option>
              {filtered.map((x) => (
                <option key={x.value} value={x.value}>
                  {x.label}
                </option>
              ))}
            </select>
          ) : (
            <p role="status">No matching options</p>
          )}
        </div>
      )}
    </div>
  );
}
