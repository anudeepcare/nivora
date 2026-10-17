"use client";
import { useId, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search as SearchIcon, ArrowUpRight, X } from "lucide-react";
import { api } from "@/lib/client";
import type { Company } from "@/lib/types";
import { cryptoSearchSymbol, searchSelection } from "@/lib/search-selection";
import { useProduct } from "./Session";
import { SecurityLogo } from "./Ui";
export default function Search({
  large = false,
  autoFocus = false,
  onNavigate,
}: {
  large?: boolean;
  autoFocus?: boolean;
  onNavigate?: () => void;
}) {
  const listId = useId();
  const { demo } = useProduct(),
    router = useRouter(),
    box = useRef<HTMLDivElement>(null),
    input = useRef<HTMLInputElement>(null),
    [query, setQuery] = useState(""),
    [results, setResults] = useState<Company[]>([]),
    [open, setOpen] = useState(false),
    [selected, setSelected] = useState(-1),
    [loading, setLoading] = useState(false),
    [error, setError] = useState("");
  const prefix = demo ? "/preview" : "";
  useEffect(() => {
    const close = (e: PointerEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => {
      document.removeEventListener("pointerdown", close);
    };
  }, []);
  useEffect(() => {
    setSelected(-1);
    setResults([]);
    setError("");
    if (query.trim().length < 1) {
      setResults([]);
      setLoading(false);
      return;
    }
    let active = true;
    const c = new AbortController();
    const base = cryptoSearchSymbol(query)?.split("/")[0] ?? null;
    const cryptoMatch: Company | null = base
      ? {
          symbol: `${base}/USD`,
          name: base === "BTC" ? "Bitcoin" : "Ethereum",
          exchange: "Crypto · USD pair",
          currency: "USD",
          assetType: "crypto",
        }
      : null;
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const rows = demo
          ? Object.values(demo.research)
              .map((r) => r.company)
              .filter((c) =>
                (c.symbol + " " + c.name)
                  .toLowerCase()
                  .includes(query.toLowerCase()),
              )
          : (
              await api<{ results: Company[] }>(
                `search?q=${encodeURIComponent(query.trim().replace(/^\$/, ""))}`,
                undefined,
                c.signal,
              )
            ).results;
        if (active) {
          setResults(
            cryptoMatch
              ? [
                  cryptoMatch,
                  ...rows.filter((r) => r.symbol !== cryptoMatch.symbol),
                ]
              : rows,
          );
          setError("");
        }
      } catch (e) {
        if (active) {
          setResults(cryptoMatch ? [cryptoMatch] : []);
          setError(e instanceof Error ? e.message : "Search unavailable");
        }
      } finally {
        if (active) setLoading(false);
      }
    }, 300);
    return () => {
      active = false;
      clearTimeout(timer);
      c.abort();
    };
  }, [query, demo]);
  const go = (symbol: string) => {
    setOpen(false);
    setQuery("");
    onNavigate?.();
    router.push(`${prefix}/research/${encodeURIComponent(symbol)}`);
  };
  function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      go(searchSelection(query, results, selected));
    } catch {
      setError("Choose a company below or enter its ticker.");
      setOpen(true);
    }
  }
  return (
    <div ref={box} className={`search ${large ? "large" : ""}`}>
      <form onSubmit={submit}>
        <SearchIcon size={19} />
        <input
          ref={input}
          autoFocus={autoFocus}
          type="search"
          aria-label="Search companies or tickers"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={
            selected >= 0 ? `${listId}-${selected}` : undefined
          }
          placeholder="Search a company or crypto"
          autoComplete="off"
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setOpen(false);
              return;
            }
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setSelected((i) => Math.min(results.length - 1, i + 1));
              setOpen(true);
            }
            if (e.key === "ArrowUp") {
              e.preventDefault();
              setSelected((i) => Math.max(-1, i - 1));
            }
          }}
        />
        {query ? (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => {
              setQuery("");
              setOpen(false);
            }}
          >
            <X size={17} />
          </button>
        ) : (
          <kbd>⌘ K</kbd>
        )}
      </form>
      {open && query.trim().length >= 1 && (
        <div
          className="search-results"
          id={listId}
          role="listbox"
          aria-label="Companies"
        >
          {loading && <p role="status">Searching…</p>}
          {results.map((c, i) => (
            <button
              type="button"
              role="option"
              id={`${listId}-${i}`}
              aria-selected={selected === i}
              className={selected === i ? "selected" : ""}
              key={`${c.symbol}:${c.exchange}`}
              onClick={() => go(c.symbol)}
            >
              <SecurityLogo symbol={c.symbol} size={34} />
              <span>
                <b>{c.name}</b>
                <small>
                  {c.symbol} · {c.exchange}
                </small>
              </span>
              <ArrowUpRight size={16} />
            </button>
          ))}
          {error && <p>{error}</p>}
          {!loading && !results.length && (
            <p>
              {error
                ? "Search is temporarily unavailable. You can still open an exact ticker below."
                : "No matching US listing or USD crypto pair returned."}
            </p>
          )}
          {/^[A-Za-z0-9][A-Za-z0-9.-]{0,14}(\/[A-Za-z]{3,5})?$/.test(
            query.trim(),
          ) &&
            !results.some(
              (c) => c.symbol.toUpperCase() === query.trim().toUpperCase(),
            ) && (
              <button
                type="button"
                className="search-direct"
                onClick={() => go(searchSelection(query, []))}
              >
                <SearchIcon size={17} />
                <span>
                  <b>Open {query.trim().toUpperCase()}</b>
                  <small>Look up this exact ticker</small>
                </span>
                <ArrowUpRight size={16} />
              </button>
            )}
        </div>
      )}
    </div>
  );
}
