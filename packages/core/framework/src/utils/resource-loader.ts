import { dynamicImport, promiseAll, readDirRecursive } from "@medusajs/utils"
import { Dirent } from "fs"
import { access } from "fs/promises"
import { join } from "path"
import { logger } from "../logger"

export abstract class ResourceLoader {
  /**
   * The name of the resource (e.g job, subscriber, workflow)
   */
  protected abstract resourceName: string

  /**
   * The directory from which to load the jobs
   * @private
   */
  #sourceDir: string | string[]

  /**
   * The list of file names to exclude from the subscriber scan
   * @private
   */
  #excludes: RegExp[] = [
    /index\.js/,
    /index\.ts/,
    /^_[^/\\]*(\.[^/\\]+)?$/,
    /^(?!.*\.(js|ts)$|.*\.d\.ts$).+$|.*\.d\.ts$/, // Ignore all files that don't end in .js or .ts, or are .d.ts files
  ]

  constructor(sourceDir: string | string[]) {
    this.#sourceDir = sourceDir
  }

  protected async discoverResources(): Promise<Record<string, unknown>[]> {
    const normalizedSourcePath = Array.isArray(this.#sourceDir)
      ? this.#sourceDir
      : [this.#sourceDir]

    const promises = normalizedSourcePath.map(async (sourcePath) => {
      try {
        await access(sourcePath)
      } catch {
        logger.info(
          `No ${this.resourceName} to load from ${sourcePath}. skipped.`
        )
        return
      }

      return await readDirRecursive(sourcePath).then(async (entries) => {
        const fileEntries = entries.filter((entry: Dirent) => {
          return (
            !entry.isDirectory() &&
            !this.#excludes.some((exclude) => exclude.test(entry.name))
          )
        })

        return await promiseAll(
          fileEntries.map(async (entry: Dirent) => {
            const fullPath = join(entry.path, entry.name)

            const module_ = await dynamicImport(fullPath)

            await this.onFileLoaded(fullPath, module_)
            return module_
          })
        )
      })
    })

    const resources = await promiseAll(promises)
    return resources.flat()
  }

  /**
   * Called when a file is imported
   * @param path - The path of the file
   * @param fileExports - The exports of the file
   */
  protected abstract onFileLoaded(
    path: string,
    fileExports: Record<string, unknown>
  ): Promise<void> | never
}
