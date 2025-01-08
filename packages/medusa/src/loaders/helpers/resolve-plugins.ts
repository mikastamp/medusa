import fs from "fs"
import path from "path"
import { isString, readDir } from "@medusajs/framework/utils"
import { ConfigModule, PluginDetails } from "@medusajs/framework/types"

export const MEDUSA_PROJECT_NAME = "project-plugin"
const MEDUSA_APP_SOURCE_PATH = "src"

function createPluginId(name: string): string {
  return name
}

function createFileContentHash(path: string, files: string): string {
  return path + files
}

/**
 * Finds the correct path for the plugin. If it is a local plugin it will be
 * found in the plugins folder. Otherwise we will look for the plugin in the
 * installed npm packages.
 * @param {string} pluginPath - the name of the plugin to find. Should match
 *    the name of the folder where the plugin is contained.
 * @return {object} the plugin details
 */
async function resolvePlugin(
  rootDirectory: string,
  pluginPath: string,
  options?: any
): Promise<PluginDetails> {
  /**
   * The package.json file should be requirable in order to resolve
   * the plugin
   */
  const pkgJSONPath = require.resolve(path.join(pluginPath, "package.json"), {
    paths: [rootDirectory],
  })
  const resolvedPath = path.dirname(pkgJSONPath)
  const packageJSON = JSON.parse(fs.readFileSync(pkgJSONPath, "utf-8"))

  const name = packageJSON.name || pluginPath
  const srcDir = packageJSON.main ? path.dirname(packageJSON.main) : "build"
  const resolve = path.join(resolvedPath, srcDir)
  const modules = await readDir(path.join(resolve, "modules"), {
    ignoreMissing: true,
  })
  const pluginOptions = options ?? {}

  return {
    resolve,
    name,
    id: createPluginId(name),
    options: pluginOptions,
    version: packageJSON.version || "0.0.0",
    modules: modules.map((mod) => {
      return {
        resolve: `${pluginPath}/${srcDir}/modules/${mod.name}`,
        options: pluginOptions,
      }
    }),
  }
}

export async function getResolvedPlugins(
  rootDirectory: string,
  configModule: ConfigModule,
  isMedusaProject = false
): Promise<PluginDetails[]> {
  const resolved = await Promise.all(
    (configModule?.plugins || []).map(async (plugin) => {
      if (isString(plugin)) {
        return resolvePlugin(rootDirectory, plugin)
      }
      return resolvePlugin(rootDirectory, plugin.resolve, plugin.options)
    })
  )

  if (isMedusaProject) {
    const extensionDirectory = path.join(rootDirectory, MEDUSA_APP_SOURCE_PATH)
    resolved.push({
      resolve: extensionDirectory,
      name: MEDUSA_PROJECT_NAME,
      id: createPluginId(MEDUSA_PROJECT_NAME),
      options: configModule,
      version: createFileContentHash(process.cwd(), `**`),
    })
  }

  return resolved
}
