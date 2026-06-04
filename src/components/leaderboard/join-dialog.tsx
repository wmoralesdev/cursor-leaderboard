"use client"

import { useState } from "react"
import { useRouter } from "@tanstack/react-router"
import { CheckCircle2, Plus } from "lucide-react"

import { type SubmitResult, submitEntry } from "@/lib/api"
import { countryByCode } from "@/lib/countries"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { CountryCombobox } from "@/components/ui/combobox"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

function JoinDialog() {
  const router = useRouter()
  const [handle, setHandle] = useState("")
  const [country, setCountry] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<SubmitResult | null>(null)

  function reset() {
    setHandle("")
    setCountry(null)
    setError(null)
    setResult(null)
    setSubmitting(false)
  }

  function handleOpenChange(next: boolean) {
    if (!next) reset()
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)

    if (!handle.trim()) {
      setError("Enter your Cursor handle or profile URL.")
      return
    }
    if (!country) {
      setError("Select your country.")
      return
    }

    setSubmitting(true)
    try {
      const submitResult = await submitEntry({
        handle: handle.trim(),
        country,
      })
      setResult(submitResult)
      await router.invalidate()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong. Try again."
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog onOpenChange={handleOpenChange}>
      <DialogTrigger className={cn(buttonVariants({ variant: "default" }))}>
        <Plus />
        Join leaderboard
      </DialogTrigger>

      <DialogContent>
        {result ? (
          <SuccessState result={result} />
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle>Join the leaderboard</DialogTitle>
              <DialogDescription>
                We pull your public stats from your Cursor profile and rank you.
              </DialogDescription>
            </DialogHeader>

            <Field>
              <FieldLabel htmlFor="join-handle">Cursor profile</FieldLabel>
              <Input
                id="join-handle"
                value={handle}
                onChange={(event) => setHandle(event.target.value)}
                placeholder="@wmoralesdev or cursor.com/@wmoralesdev"
                autoComplete="off"
                autoFocus
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="join-country">Country</FieldLabel>
              <CountryCombobox
                id="join-country"
                value={country}
                onValueChange={setCountry}
              />
            </Field>

            {error && (
              <p className="text-destructive text-[0.6875rem]">{error}</p>
            )}

            <DialogFooter>
              <DialogClose
                type="button"
                className={cn(buttonVariants({ variant: "ghost" }))}
              >
                Cancel
              </DialogClose>
              <Button type="submit" variant="default" disabled={submitting}>
                {submitting ? "Adding…" : "Add me"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

function SuccessState({ result }: { result: SubmitResult }) {
  const country = countryByCode(result.entry.country)
  return (
    <div className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <CheckCircle2 className="text-success size-4" />
          You&apos;re on the board
        </DialogTitle>
        <DialogDescription>
          {result.entry.displayName || `@${result.entry.handle}`} added
          {country ? ` for ${country.flag} ${country.name}` : ""}.
        </DialogDescription>
      </DialogHeader>

      <div className="bg-muted/40 flex items-center justify-between rounded-lg border px-4 py-3">
        <span className="text-muted-foreground text-xs">Global rank by agents</span>
        <span className="text-xl font-semibold tracking-tight">
          {result.rank ? `#${result.rank}` : "—"}
        </span>
      </div>

      <DialogFooter>
        <DialogClose className={cn(buttonVariants({ variant: "default" }))}>
          View board
        </DialogClose>
      </DialogFooter>
    </div>
  )
}

export { JoinDialog }
