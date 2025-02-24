import { BundlerOptions } from "../types"
import { getProductionConfig, mergeConfigWithUserConfig } from "./config"

export async function build(options: BundlerOptions) {
  const { build: viteBuild } = await import("vite")

  const viteConfig = await getProductionConfig(options)
  const finalConfig = await mergeConfigWithUserConfig(viteConfig, options)

  await viteBuild(finalConfig)
}
