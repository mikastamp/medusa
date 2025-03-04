import path from "node:path"
import type { Config } from "tailwindcss"
import type { Plugin } from "vite"

interface InjectTailwindCSSOptions {
  entry: string
  sources?: string[]
}

export const injectTailwindCSS = (
  options: InjectTailwindCSSOptions
): Plugin => {
  return {
    name: "medusa:inject-tailwindcss",
    config: () => ({
      css: {
        postcss: {
          plugins: [
            require("tailwindcss")({
              config: createTailwindConfig(options.entry, options.sources),
            }),
          ],
        },
      },
    }),
  }
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

  const extensions = sources.map((s) => path.join(s, "**/*.{js,ts,jsx,tsx}"))

  const config: Config = {
    presets: [require("@medusajs/ui-preset")],
    content: [html, root, dashboard, ui, ...extensions],
    darkMode: "class",
  }

  return config
}
