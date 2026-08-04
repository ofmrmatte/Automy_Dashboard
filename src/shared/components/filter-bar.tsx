import { type ReactNode } from "react";
import { SearchInput } from "@/shared/components/ui";
import { cn } from "@/shared/utils/cn";

export function FilterBar({
  search,
  onSearchChange,
  searchPlaceholder,
  children,
  className,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-4 flex flex-col gap-3 sm:flex-row", className)}>
      <SearchInput value={search} onChange={onSearchChange} placeholder={searchPlaceholder} />
      {children}
    </div>
  );
}
