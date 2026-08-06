import { useQuery } from "@tanstack/react-query";
import {
  Boxes,
  CalendarClock,
  FileText,
  Headphones,
  Receipt,
  ScrollText,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { globalSearchQueryOptions } from "@/features/search/api/search.queries";
import type { SearchResult, SearchResultType } from "@/features/search/types";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/shared/components/ui";
import { cn } from "@/shared/utils/cn";

const typeLabels: Record<SearchResultType, string> = {
  clients: "Clientes",
  products: "Produtos",
  contracts: "Contratos",
  finance: "Financeiro",
  scheduling: "Agenda",
  support: "Suporte",
  users: "Usuários",
  audit: "Auditoria",
};

const typeIcons = {
  clients: Users,
  products: Boxes,
  contracts: FileText,
  finance: Receipt,
  scheduling: CalendarClock,
  support: Headphones,
  users: ShieldCheck,
  audit: ScrollText,
} satisfies Record<SearchResultType, typeof Search>;

function groupedResults(results: SearchResult[]) {
  return results.reduce<Record<SearchResultType, SearchResult[]>>(
    (groups, result) => {
      groups[result.type].push(result);
      return groups;
    },
    {
      clients: [],
      products: [],
      contracts: [],
      finance: [],
      scheduling: [],
      support: [],
      users: [],
      audit: [],
    },
  );
}

export function GlobalSearch({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const searchQuery = useQuery(globalSearchQueryOptions(debounced));
  const groups = useMemo(
    () => groupedResults(searchQuery.data?.results ?? []),
    [searchQuery.data?.results],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(query), 250);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  function selectResult(result: SearchResult) {
    setOpen(false);
    window.location.assign(result.url);
  }

  return (
    <>
      <button
        type="button"
        className={cn("relative block w-full max-w-md text-left", className)}
        onClick={() => setOpen(true)}
        aria-label="Pesquisar em tudo"
      >
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          tabIndex={-1}
          className="pointer-events-none h-9 border-0 bg-muted/70 pl-9 pr-12 ring-ring/20 focus:ring-3"
          placeholder="Pesquisar em tudo..."
          readOnly
        />
        <kbd className="absolute right-2 top-1/2 hidden -translate-y-1/2 rounded border border-border bg-background px-1.5 py-0.5 text-[10px] text-muted-foreground sm:block">
          ⌘ K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          value={query}
          onValueChange={setQuery}
          placeholder="Pesquisar clientes, contratos, tickets..."
        />
        <CommandList>
          {query.trim().length < 2 && (
            <CommandEmpty>Digite ao menos 2 caracteres para pesquisar.</CommandEmpty>
          )}
          {query.trim().length >= 2 && searchQuery.isFetching && (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              Pesquisando...
            </div>
          )}
          {query.trim().length >= 2 && searchQuery.isError && (
            <div className="px-4 py-6 text-center text-sm text-destructive">
              Não foi possível pesquisar.
            </div>
          )}
          {query.trim().length >= 2 &&
            !searchQuery.isFetching &&
            !searchQuery.data?.results.length && (
              <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
            )}
          {Object.entries(groups).map(([type, results]) => {
            if (results.length === 0) return null;
            const Icon = typeIcons[type as SearchResultType];
            return (
              <CommandGroup key={type} heading={typeLabels[type as SearchResultType]}>
                {results.map((result) => (
                  <CommandItem
                    key={`${result.type}-${result.id}`}
                    value={`${result.type} ${result.title} ${result.description} ${result.meta}`}
                    onSelect={() => selectResult(result)}
                    className="items-start gap-3"
                  >
                    <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground">
                      <Icon className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{result.title}</span>
                      <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                        {result.description || result.meta || typeLabels[result.type]}
                      </span>
                    </span>
                    {result.meta && (
                      <span className="rounded-md bg-muted px-2 py-1 text-[10px] text-muted-foreground">
                        {result.meta}
                      </span>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            );
          })}
        </CommandList>
      </CommandDialog>
    </>
  );
}
