"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Building2, FileText, X, Loader2 } from "lucide-react";
import axios from "axios";

interface DealResult {
  id: string;
  title: string;
  company: string;
  contact_person: string | null;
  value: number;
  stage: string;
  status: string;
  probability: number;
  assigned_to_name: string | null;
}

interface ClientResult {
  id: string;
  company_name: string;
  primary_contact_name: string | null;
  primary_contact_email: string | null;
  status: string;
  industry: string | null;
  assigned_to_name: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  active: "bg-blue-500/10 text-blue-500",
  won: "bg-emerald-500/10 text-emerald-600",
  lost: "bg-red-500/10 text-red-500",
  "on-hold": "bg-gray-500/10 text-gray-400",
  prospect: "bg-blue-500/10 text-blue-500",
  inactive: "bg-gray-500/10 text-gray-400",
};

function formatAmount(val: number): string {
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(1)}K`;
  if (val > 0) return `$${val.toFixed(0)}`;
  return "$0";
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function GlobalSearch() {
  const router = useRouter();
  const session = useSession();
  const role = session.data?.user?.role ?? "scales_man";

  const [query, setQuery] = useState("");
  const [deals, setDeals] = useState<DealResult[]>([]);
  const [clients, setClients] = useState<ClientResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Keyboard shortcut: Cmd/Ctrl + K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
      if (e.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Debounced search
  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setDeals([]);
      setClients([]);
      return;
    }
    try {
      setLoading(true);
      const { data } = await axios.get(
        `/api/search?q=${encodeURIComponent(q)}`,
      );
      if (data.success) {
        setDeals(data.deals);
        setClients(data.clients);
      }
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => search(query), 250);
    return () => clearTimeout(t);
  }, [query, search]);

  const handleDealClick = (deal: DealResult) => {
    router.push(`/deals/deal_details/${deal.id}`);
    setOpen(false);
    setQuery("");
  };

  const handleClientClick = (client: ClientResult) => {
    router.push(`/clients/${client.id}`);
    setOpen(false);
    setQuery("");
  };

  const hasResults = deals.length > 0 || clients.length > 0;
  const showEmpty = query.length >= 2 && !loading && !hasResults;

  return (
    <div ref={containerRef} className="relative w-full max-w-sm">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search deals, clients... ⌘K"
          className="pl-9 pr-8 bg-background border-border text-sm h-9"
        />
        {loading ? (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground animate-spin" />
        ) : (
          query && (
            <button
              onClick={() => {
                setQuery("");
                setDeals([]);
                setClients([]);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )
        )}
      </div>

      {/* Dropdown */}
      {open && query.length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden max-h-[420px] overflow-y-auto">
          {/* Loading */}
          {loading && (
            <div className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Searching...
            </div>
          )}

          {/* Empty */}
          {showEmpty && (
            <div className="px-4 py-8 text-center">
              <Search className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                No results for &ldquo;{query}&rdquo;
              </p>
            </div>
          )}

          {/* Deals section */}
          {deals.length > 0 && (
            <div>
              <div className="px-4 py-2 border-b border-border">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                  <FileText className="w-3 h-3" />
                  Deals ({deals.length})
                </p>
              </div>
              {deals.map((deal) => (
                <button
                  key={deal.id}
                  onClick={() => handleDealClick(deal)}
                  className="w-full text-left px-4 py-3 hover:bg-secondary/40 transition-colors border-b border-border last:border-0"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {deal.company}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {deal.contact_person && (
                          <span className="text-xs text-muted-foreground truncate">
                            {deal.contact_person}
                          </span>
                        )}
                        {role !== "scales_man" && deal.assigned_to_name && (
                          <span className="text-xs text-muted-foreground">
                            · {deal.assigned_to_name}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-sm font-semibold text-foreground">
                        {formatAmount(Number(deal.value))}
                      </span>
                      <Badge
                        className={`text-xs px-1.5 py-0 h-5 ${
                          STATUS_COLORS[deal.status] ?? ""
                        }`}
                      >
                        {capitalize(deal.stage)}
                      </Badge>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Clients section */}
          {clients.length > 0 && (
            <div>
              <div className="px-4 py-2 border-b border-border bg-secondary/20">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                  <Building2 className="w-3 h-3" />
                  Clients ({clients.length})
                </p>
              </div>
              {clients.map((client) => (
                <button
                  key={client.id}
                  onClick={() => handleClientClick(client)}
                  className="w-full text-left px-4 py-3 hover:bg-secondary/40 transition-colors border-b border-border last:border-0"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {client.company_name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {client.primary_contact_name && (
                          <span className="text-xs text-muted-foreground truncate">
                            {client.primary_contact_name}
                          </span>
                        )}
                        {client.industry && (
                          <span className="text-xs text-muted-foreground">
                            · {client.industry}
                          </span>
                        )}
                      </div>
                    </div>
                    <Badge
                      className={`text-xs px-1.5 py-0 h-5 flex-shrink-0 ${
                        STATUS_COLORS[client.status] ?? ""
                      }`}
                    >
                      {capitalize(client.status)}
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Footer hint */}
          {hasResults && (
            <div className="px-4 py-2 bg-secondary/20 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Press{" "}
                <kbd className="px-1.5 py-0.5 bg-background border border-border rounded text-xs font-mono">
                  ↵
                </kbd>{" "}
                to open ·{" "}
                <kbd className="px-1.5 py-0.5 bg-background border border-border rounded text-xs font-mono">
                  Esc
                </kbd>{" "}
                to close
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
