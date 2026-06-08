"use client"

import { ArrowDown, ArrowUp } from "lucide-react"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type ScrollMetrics = {
  y: number
  max: number
}

function readScrollMetrics(): ScrollMetrics {
  const max = Math.max(
    0,
    document.documentElement.scrollHeight - window.innerHeight,
  )
  return { y: window.scrollY, max }
}

function scrollTarget(y: number, max: number): "top" | "end" {
  return y > max / 2 ? "top" : "end"
}

function ScrollEdgeButton() {
  const [metrics, setMetrics] = useState<ScrollMetrics>({ y: 0, max: 0 })

  useEffect(() => {
    function update() {
      setMetrics(readScrollMetrics())
    }

    update()
    window.addEventListener("scroll", update, { passive: true })
    window.addEventListener("resize", update, { passive: true })
    return () => {
      window.removeEventListener("scroll", update)
      window.removeEventListener("resize", update)
    }
  }, [])

  const { y, max } = metrics
  const scrollable = max > 96
  const target = scrollTarget(y, max)
  const atTarget = target === "top" ? y <= 8 : y >= max - 8
  const visible = scrollable && !atTarget

  if (!visible) return null

  const label = target === "top" ? "Scroll to top" : "Scroll to end"

  function handleClick() {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    window.scrollTo({
      top: target === "top" ? 0 : max,
      behavior: reduced ? "auto" : "smooth",
    })
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      aria-label={label}
      title={label}
      onClick={handleClick}
      className={cn(
        "border-border/80 bg-card fixed z-40 size-9 rounded-full",
        "bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-[max(1.25rem,env(safe-area-inset-right))]",
      )}
    >
      {target === "top" ? (
        <ArrowUp aria-hidden className="size-4" />
      ) : (
        <ArrowDown aria-hidden className="size-4" />
      )}
    </Button>
  )
}

export { ScrollEdgeButton }
