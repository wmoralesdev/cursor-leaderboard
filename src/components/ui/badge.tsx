import { cva  } from "class-variance-authority"
import type {VariantProps} from "class-variance-authority";

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 rounded-md border px-1.5 py-0.5 text-[0.6875rem] font-medium whitespace-nowrap [&_svg]:size-3 [&_svg]:pointer-events-none",
  {
    variants: {
      variant: {
        default: "border-transparent bg-secondary text-secondary-foreground",
        brand:
          "border-[color-mix(in_oklab,var(--brand)_42%,transparent)] bg-[color-mix(in_oklab,var(--brand)_12%,transparent)] text-brand",
        info: "border-[color-mix(in_oklab,var(--info)_42%,transparent)] bg-[color-mix(in_oklab,var(--info)_12%,transparent)] text-info",
        success:
          "border-[color-mix(in_oklab,var(--success)_42%,transparent)] bg-[color-mix(in_oklab,var(--success)_12%,transparent)] text-success",
        outline: "border-border text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
