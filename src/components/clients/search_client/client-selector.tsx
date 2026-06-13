"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Building2, X, Search, Loader2 } from "lucide-react";
import axios from "axios";

interface ClientOption {
  id: string;
  company_name: string;
  status: string;
  industry: string | null;
}

interface ClientSelectorProps {
  value?: string | null; // selected client_id
  displayName?: string | null; // display name when pre-selected
  onChange: (clientId: string | null, clientName: string | null) => void;
  disabled?: boolean;
  placeholder?: string;
}

const STATUS_DOT: Record<string, string> = {
  active: "bg-emerald-500",
  prospect: "bg-blue-500",
  inactive: "bg-gray-400",
};

export function ClientSelector({
  value,
  displayName,
  onChange,
  disabled = false,
  placeholder = "Search clients...",
}: ClientSelectorProps) {
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<ClientOption[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<ClientOption | null>(
    value && displayName
      ? { id: value, company_name: displayName, status: "", industry: null }
      : null,
  );

  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
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

  // Debounced search
  const fetchClients = useCallback(async (q: string) => {
    try {
      setLoading(true);
      const { data } = await axios.get(
        `/api/clients/search?q=${encodeURIComponent(q)}`,
      );
      if (data.success) setOptions(data.clients);
    } catch {
      setOptions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => fetchClients(query), 250);
    return () => clearTimeout(t);
  }, [query, open, fetchClients]);

  // Open dropdown and load initial options
  const handleFocus = () => {
    if (disabled) return;
    setOpen(true);
    if (options.length === 0) fetchClients("");
  };

  const handleSelect = (client: ClientOption) => {
    setSelected(client);
    setQuery("");
    setOpen(false);
    onChange(client.id, client.company_name);
  };

  const handleClear = () => {
    setSelected(null);
    setQuery("");
    onChange(null, null);
  };

  // Sync external value changes
  useEffect(() => {
    if (!value) {
      setSelected(null);
    }
  }, [value]);

  return (
    <div ref={containerRef} className="relative">
      {selected ? (
        // Selected state — show chip
        <div className="flex items-center gap-2 px-3 py-2 rounded-md border border-border bg-secondary/30">
          <Building2 className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
          <span className="text-sm font-medium text-foreground flex-1 truncate">
            {selected.company_name}
          </span>
          {selected.status && (
            <Badge
              variant="outline"
              className="text-xs px-1.5 py-0 flex-shrink-0"
            >
              {selected.status}
            </Badge>
          )}
          {!disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ) : (
        // Search input
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={handleFocus}
            placeholder={placeholder}
            disabled={disabled}
            className="pl-9 bg-background border-border text-sm"
          />
          {loading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground animate-spin" />
          )}
        </div>
      )}

      {/* Dropdown */}
      {open && !selected && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg overflow-hidden">
          {loading && options.length === 0 ? (
            <div className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Searching...
            </div>
          ) : options.length === 0 ? (
            <div className="px-4 py-3 text-sm text-muted-foreground">
              {query.trim()
                ? `No clients found for "${query}"`
                : "No clients yet. Create one first."}
            </div>
          ) : (
            <ul className="max-h-52 overflow-y-auto py-1">
              {options.map((client) => (
                <li key={client.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(client)}
                    className="w-full text-left px-4 py-2.5 hover:bg-secondary/50 transition-colors flex items-center gap-3"
                  >
                    <div
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        STATUS_DOT[client.status] ?? "bg-gray-400"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {client.company_name}
                      </p>
                      {client.industry && (
                        <p className="text-xs text-muted-foreground truncate">
                          {client.industry}
                        </p>
                      )}
                    </div>
                    <Badge
                      variant="outline"
                      className="text-xs flex-shrink-0 px-1.5 py-0"
                    >
                      {client.status}
                    </Badge>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
