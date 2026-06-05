"use client"

import { Search, X } from "lucide-react"

import { SEARCH_MIN_LENGTH } from "@/lib/search"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import { cn } from "@/lib/utils"

type RankSearchProps = {
  query: string
  onQueryChange: (query: string) => void
  onClear: () => void
  loading?: boolean
  isDebouncing?: boolean
  error?: string | null
  className?: string
}

function RankSearch({
  query,
  onQueryChange,
  onClear,
  loading = false,
  isDebouncing = false,
  error = null,
  className,
}: RankSearchProps) {
  const trimmed = query.trim()
  const showClear = trimmed.length > 0

  return (
    <section
      aria-labelledby="find-rank-label"
      className={cn("flex w-full flex-col gap-3", className)}
    >
      <Field>
        <FieldLabel id="find-rank-label">Find your rank</FieldLabel>

        <div
          role="search"
          aria-label="Find your rank"
          className="border-input bg-input/30 focus-within:border-ring focus-within:ring-ring/30 flex h-8 w-full items-center overflow-hidden rounded-md border transition-[color,box-shadow] focus-within:ring-2"
        >
          <div className="relative h-full min-w-0 flex-1">
            <Search
              aria-hidden
              className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2"
            />
            <input
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Name, @handle, country, or cursor.com/@handle"
              autoComplete="off"
              aria-label="Search profiles"
              className="placeholder:text-muted-foreground h-full w-full min-w-0 border-0 bg-transparent pr-2 pl-8 text-xs outline-none"
            />
          </div>

          {showClear && (
            <Button
              type="button"
              variant="ghost"
              onClick={onClear}
              aria-label="Clear search"
              className="text-muted-foreground hover:text-foreground h-8 w-8 shrink-0 rounded-none px-0"
            >
              <X className="size-3.5" />
            </Button>
          )}

          {(isDebouncing || loading) && (
            <span className="text-muted-foreground border-border/80 flex shrink-0 items-center border-l px-3 text-xs">
              {loading ? "Searching…" : "Waiting…"}
            </span>
          )}
        </div>

        {trimmed.length > 0 && trimmed.length < SEARCH_MIN_LENGTH && (
          <FieldDescription>
            Type at least {SEARCH_MIN_LENGTH} characters to search.
          </FieldDescription>
        )}

        {error && <FieldError>{error}</FieldError>}
      </Field>
    </section>
  )
}

export { RankSearch }
