import { VIRTUAL_MODULES } from "@medusajs/admin-shared"
import path from "path"
import { Config } from "tailwindcss"
import type { InlineConfig } from "vite"
import { BundlerOptions } from "../types"

export async function getBaseConfig(
  options: BundlerOptions
): Promise<InlineConfig> {
  const { default: react } = await import("@vitejs/plugin-react")
  const { default: medusa } = await import("@medusajs/admin-vite-plugin")

  const root = path.resolve(__dirname, "./")

  const backendUrl = options.backendUrl ?? ""
  const storefrontUrl = options.storefrontUrl ?? ""

  const baseConfig: InlineConfig = {
    root,
    base: options.path,
    build: {
      emptyOutDir: true,
      outDir: path.resolve(process.cwd(), options.outDir),
    },
    cacheDir: path.resolve(process.cwd(), "node_modules/.medusa/vite"),
    optimizeDeps: {
      include: [
        "react",
        "react/jsx-runtime",
        "react-dom/client",
        "react-router-dom",
        "@tanstack/react-query",
      ],
      exclude: [...VIRTUAL_MODULES],
    },
    resolve: {
      dedupe: [
        "react",
        "react-dom",
        "react-router-dom",
        "@tanstack/react-query",
      ],
    },
    define: {
      __BASE__: JSON.stringify(options.path),
      __BACKEND_URL__: JSON.stringify(backendUrl),
      __STOREFRONT_URL__: JSON.stringify(storefrontUrl),
    },
    css: {
      postcss: {
        plugins: [
          require("tailwindcss")({
            config: createTailwindConfig(root, options.sources),
          }),
        ],
      },
    },
    plugins: [
      react(),
      medusa({
        sources: options.sources,
      }),
    ],
  }

  return baseConfig
}

const HMR_DEFAULT_PORT = 5173

export async function getDevelopmentConfig(
  options: BundlerOptions
): Promise<InlineConfig> {
  const baseConfig = await getBaseConfig(options)

  return {
    ...baseConfig,
    mode: "development",
    resolve: {
      ...baseConfig.resolve,
    },
    server: {
      cors: false,
      middlewareMode: true,
      open: true,
      hmr: {
        clientPort: HMR_DEFAULT_PORT,
      },
    },
    appType: "custom",
  } satisfies InlineConfig
}

export async function getProductionConfig(
  options: BundlerOptions
): Promise<InlineConfig> {
  const baseConfig = await getBaseConfig(options)

  return {
    ...baseConfig,
    mode: "production",
  }
}

export async function mergeConfigWithUserConfig(
  config: InlineConfig,
  ctx: BundlerOptions
) {
  const { mergeConfig } = await import("vite")
  const { vite: userConfig } = ctx

  if (userConfig) {
    return mergeConfig(config, userConfig(config))
  }

  return config
}

function createTailwindConfig(entry: string, sources: string[] = []) {
  const root = path.join(entry, "**/*.{js,ts,jsx,tsx}")
  const html = path.join(entry, "index.html")

  let dashboard = ""

  try {
    dashboard = path.join(
      path.dirname(require.resolve("@medusajs/dashboard")),
      "**/*.{js,ts,jsx,tsx}"
    )
  } catch (_e) {
    // ignore
  }

  let ui: string = ""

  try {
    ui = path.join(
      path.dirname(require.resolve("@medusajs/ui")),
      "**/*.{js,ts,jsx,tsx}"
    )
  } catch (_e) {
    // ignore
  }

  const extensions = sources.map((s) =>
    path.join(s, "**/*.{js,ts,jsx,tsx,mjs,cjs}")
  )

  const config: Config = {
    presets: [require("@medusajs/ui-preset")],
    content: [html, root, dashboard, ui, ...extensions],
    darkMode: "class",
  }

  return config
}
