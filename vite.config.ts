import path from "node:path"
import { defineConfig, loadEnv } from "vite"
import { devtools } from "@tanstack/devtools-vite"
import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import { nitro } from "nitro/vite"
import viteReact from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")

  return {
    envPrefix: ["VITE_", "DATABASE_", "SCRAPE_"],
    define: {
      "process.env.DATABASE_URL": JSON.stringify(env.DATABASE_URL ?? ""),
      "process.env.SCRAPE_COOLDOWN_MINUTES": JSON.stringify(
        env.SCRAPE_COOLDOWN_MINUTES ?? "15",
      ),
      "process.env.SCRAPE_USER_AGENT": JSON.stringify(
        env.SCRAPE_USER_AGENT ?? "",
      ),
    },
    resolve: {
      tsconfigPaths: true,
      alias: {
        "@": path.resolve(import.meta.dirname, "./src"),
      },
    },
    plugins: [devtools(), tailwindcss(), tanstackStart(), nitro(), viteReact()],
  }
})
