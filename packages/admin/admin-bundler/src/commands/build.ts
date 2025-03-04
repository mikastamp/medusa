import type { InlineConfig } from "vite"
import { BundlerOptions } from "../types"
import { getViteConfig } from "../utils/config"
import { writeStaticFiles } from "../utils/write-static-files"

export async function build({ plugins, ...options }: BundlerOptions) {
  const vite = await import("vite")

  try {
    await writeStaticFiles(plugins)
  } catch (error) {
    console.error(error)
    throw new Error("Failed to write static files. See error above.")
  }

  const viteConfig = await getViteConfig(options)
  const buildConfig: InlineConfig = {
    mode: "production",
    logLevel: "error",
  }

  await vite.build(vite.mergeConfig(viteConfig, buildConfig))
}
