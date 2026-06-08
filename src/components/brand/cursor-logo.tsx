import { cn } from "@/lib/utils"

const CUBE_LOGO_LIGHT = "/CUBE_2D_LIGHT.png"
const CUBE_LOGO_DARK = "/CUBE_2D_DARK.png"

type CursorLogoProps = {
  className?: string
  width?: number
  height?: number
}

function CursorLogo({ className, width = 24, height = 24 }: CursorLogoProps) {
  const imgClass = cn("shrink-0 object-contain", className)

  return (
    <>
      <img
        src={CUBE_LOGO_LIGHT}
        alt=""
        width={width}
        height={height}
        className={cn(imgClass, "dark:hidden")}
        aria-hidden
      />
      <img
        src={CUBE_LOGO_DARK}
        alt=""
        width={width}
        height={height}
        className={cn(imgClass, "hidden dark:block")}
        aria-hidden
      />
    </>
  )
}

export { CursorLogo, CUBE_LOGO_DARK, CUBE_LOGO_LIGHT }
