import { Monitor, Moon, Sun } from "lucide-react"

import { cn } from "@/lib/utils"
import type { ThemePreference } from "@/lib/theme"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

import { useTheme } from "./use-theme"

const OPTIONS: {
  value: ThemePreference
  label: string
  icon: typeof Sun
}[] = [
  { value: "dark", label: "Dark", icon: Moon },
  { value: "light", label: "Light", icon: Sun },
  { value: "system", label: "System", icon: Monitor },
]

type ThemeToggleProps = {
  className?: string
}

function ThemeToggle({ className }: ThemeToggleProps) {
  const { preference, setPreference } = useTheme()

  return (
    <ToggleGroup
      value={[preference]}
      onValueChange={(groupValue) => {
        const next = groupValue[0] as ThemePreference | undefined
        if (next) setPreference(next)
      }}
      aria-label="Theme"
      className={cn("shrink-0", className)}
    >
      {OPTIONS.map(({ value, label, icon: Icon }) => (
        <ToggleGroupItem key={value} value={value} aria-label={label}>
          <Icon />
          <span className="sr-only">{label}</span>
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}

export { ThemeToggle }
