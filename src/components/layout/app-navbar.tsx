"use client"

import { useEffect, useState } from "react"
import { Link, useRouterState } from "@tanstack/react-router"
import { Menu, X } from "lucide-react"

import { CursorLogo } from "@/components/brand/cursor-logo"
import { JoinDialog } from "@/components/leaderboard/join-dialog"
import { ThemeToggle } from "@/components/theme/theme-toggle"
import { cn } from "@/lib/utils"

const DEFAULT_LEADERBOARD_SEARCH = {
  metric: "agents" as const,
  order: "desc" as const,
  page: 1,
  limit: 100 as const,
}

const DEFAULT_COUNTRIES_SEARCH = {
  rankBy: "profiles" as const,
  order: "desc" as const,
}

const NAV_ITEMS = [
  {
    label: "Leaderboard",
    to: "/" as const,
    search: DEFAULT_LEADERBOARD_SEARCH,
    match: (pathname: string) => pathname === "/",
  },
  {
    label: "Countries",
    to: "/countries" as const,
    search: DEFAULT_COUNTRIES_SEARCH,
    match: (pathname: string) => pathname.startsWith("/countries"),
  },
  {
    label: "Models",
    to: "/models" as const,
    match: (pathname: string) => pathname.startsWith("/models"),
  },
] as const

type NavLinkProps = {
  label: string
  to: "/" | "/countries" | "/models"
  search?: typeof DEFAULT_LEADERBOARD_SEARCH | typeof DEFAULT_COUNTRIES_SEARCH
  active: boolean
  onNavigate?: () => void
  className?: string
}

function NavLink({
  label,
  to,
  search,
  active,
  onNavigate,
  className,
}: NavLinkProps) {
  return (
    <Link
      to={to}
      {...(search ? { search } : {})}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
        active
          ? "bg-muted text-foreground"
          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
        className,
      )}
    >
      {label}
    </Link>
  )
}

function AppNavbar() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!mobileOpen) return

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMobileOpen(false)
    }

    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [mobileOpen])

  return (
    <header className="border-border/60 sticky top-0 z-20 border-b bg-background/80 backdrop-blur-md">
      <div className="mx-auto grid h-12 max-w-5xl grid-cols-[1fr_auto] items-center gap-3 px-5 md:grid-cols-[auto_1fr_auto] md:gap-4">
        <Link
          to="/"
          search={DEFAULT_LEADERBOARD_SEARCH}
          className="flex min-w-0 items-center gap-2.5 text-sm tracking-tight outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/30"
        >
          <CursorLogo className="size-5" />
          <span className="truncate">Cursor Leaderboard</span>
        </Link>

        <nav
          aria-label="Main"
          className="hidden items-center justify-center gap-0.5 md:flex"
        >
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              label={item.label}
              to={item.to}
              search={"search" in item ? item.search : undefined}
              active={item.match(pathname)}
            />
          ))}
        </nav>

        <div className="flex items-center justify-end gap-2 sm:gap-3">
          <div className="border-border/60 hidden h-5 w-px shrink-0 bg-border/60 md:block" />

          <ThemeToggle className="hidden md:inline-flex" />

          <JoinDialog />

          <button
            type="button"
            className="text-muted-foreground hover:bg-muted/50 hover:text-foreground inline-flex size-8 items-center justify-center rounded-md transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/30 md:hidden"
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            onClick={() => setMobileOpen((open) => !open)}
          >
            {mobileOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </div>

      {mobileOpen ? (
        <div
          id="mobile-nav"
          className="border-border/60 border-t px-5 py-3 md:hidden"
        >
          <nav
            aria-label="Main"
            className="flex flex-col gap-1"
          >
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                label={item.label}
                to={item.to}
                search={"search" in item ? item.search : undefined}
                active={item.match(pathname)}
                onNavigate={() => setMobileOpen(false)}
                className="w-full"
              />
            ))}
          </nav>

          <div className="border-border/60 mt-3 flex items-center justify-between gap-3 border-t pt-3">
            <span className="text-muted-foreground text-xs font-medium">
              Theme
            </span>
            <ThemeToggle />
          </div>
        </div>
      ) : null}
    </header>
  )
}

export { AppNavbar }
