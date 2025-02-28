import { glob } from "glob"
import { readFileSync } from "node:fs"
import { rm } from "node:fs/promises"
import { builtinModules } from "node:module"
import path from "node:path"
import type { UserConfig } from "vite"

interface PluginOptions {
  root: string
  outDir: string
}

export async function plugin(options: PluginOptions) {
  const vite = await import("vite")
  const react = (await import("@vitejs/plugin-react")).default
  const { default: medusa } = await import("@medusajs/admin-vite-plugin")

  const entries = await glob(`${options.root}/src/admin/**/*.{ts,tsx,js,jsx}`)

  /**
   * If there is no entry point, we can skip the build
   */
  if (entries.length === 0) {
    return
  }

  // const entryPoints = entries.reduce((acc, entry) => {
  //   const relativePath = path.relative(options.root, entry)

  //   const outPath = relativePath
  //     .replace(/^src\//, "")
  //     .replace(/\.(ts|tsx|js|jsx|mjs|cjs)$/, "")

  //   acc[outPath] = path.resolve(options.root, entry)
  //   return acc
  // }, {} as Record<string, string>)

  const pkg = JSON.parse(
    readFileSync(path.resolve(options.root, "package.json"), "utf-8")
  )
  const external = new Set([
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.peerDependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
    "react",
    "react/jsx-runtime",
    "react-router-dom",
    "@medusajs/js-sdk",
    "@medusajs/admin-sdk",
    "@tanstack/react-query",
  ])

  const outDir = path.resolve(options.root, options.outDir, "src")
  const entryFile = path.resolve(
    options.root,
    "src/admin/__admin-extensions__.js"
  )

  /**
   * We need to ensure that the NODE_ENV is set to production,
   * otherwise Vite will build the dev version of React.
   */
  const originalNodeEnv = process.env.NODE_ENV
  process.env.NODE_ENV = "production"

  const pluginConfig: UserConfig = {
    build: {
      lib: {
        entry: entryFile,
        formats: ["es", "cjs"],
        fileName: "index",
      },
      emptyOutDir: false,
      minify: false,
      outDir,
      rollupOptions: {
        external: (id, importer) => {
          // If there's no importer, it's a direct dependency
          // Keep the existing external behavior
          if (!importer) {
            const idParts = id.split("/")
            const name = idParts[0]?.startsWith("@")
              ? `${idParts[0]}/${idParts[1]}`
              : idParts[0]

            const builtinModulesWithNodePrefix = [
              ...builtinModules,
              ...builtinModules.map((modName) => `node:${modName}`),
            ]

            return Boolean(
              (name && external.has(name)) ||
                (name && builtinModulesWithNodePrefix.includes(name))
            )
          }

          // For transient dependencies (those with importers),
          // bundle them if they're not in our external set
          const idParts = id.split("/")
          const name = idParts[0]?.startsWith("@")
            ? `${idParts[0]}/${idParts[1]}`
            : idParts[0]

          return Boolean(name && external.has(name))
        },
        output: {
          preserveModules: false,
          interop: "auto",
          chunkFileNames: () => {
            return `_chunks/[name]-[hash]`
          },
        },
      },
    },
    plugins: [
      react(),
      medusa({
        sources: [path.resolve(options.root, "src/admin")],
        plugin: true,
      }),
      {
        name: "clear-admin-plugin",
        buildStart: async () => {
          try {
            await rm(outDir, { recursive: true, force: true })
          } catch (e) {
            // Directory might not exist, ignore
          }
        },
      },
    ],
    logLevel: "silent",
    clearScreen: false,
  }

  await vite.build(pluginConfig)

  /**
   * Restore the original NODE_ENV
   */
  process.env.NODE_ENV = originalNodeEnv
}
