import { MedusaContainer } from "@medusajs/types"
import { dynamicImport } from "@medusajs/utils"
import { logger } from "../logger"
import { Migrator } from "./migrator"
import { basename } from "path"

export class MigrationScriptsMigrator extends Migrator {
  protected migration_table_name = "script_migrations"

  constructor({ container }: { container: MedusaContainer }) {
    super({ container })
  }

  /**
   * Run the migration scripts
   * @param paths - The paths from which to load the scripts
   */
  async run(paths: string[]): Promise<void> {
    const scriptPaths = await this.getPendingMigrations(paths)
    for (const script of scriptPaths) {
      const scriptFn = await dynamicImport(script)

      if (!scriptFn.default) {
        throw new Error(
          `Failed to load migration script ${script}. No default export found.`
        )
      }

      await this.insertMigration([{ script_name: `'${basename(script)}'` }])

      logger.info(`Running migration script ${script}`)
      try {
        const tracker = this.trackDuration()

        await scriptFn.default({ container: this.container })

        logger.info(
          `Migration script ${script} completed (${tracker.getSeconds()}s)`
        )

        await this.#updateMigrationFinishedAt(script)
      } catch (error) {
        logger.error(`Failed to run migration script ${script}:`, error)
        await this.#deleteMigration(basename(script))
        throw error
      }
    }
  }

  async getPendingMigrations(migrationPaths: string[]): Promise<string[]> {
    const executedMigrations = new Set(
      (await this.getExecutedMigrations()).map((item) => item.script_name)
    )
    const all = await this.loadMigrationFiles(migrationPaths)

    return all.filter((item) => !executedMigrations.has(basename(item)))
  }

  protected async createMigrationTable(): Promise<void> {
    await this.pgConnection.raw(`
      CREATE TABLE IF NOT EXISTS ${this.migration_table_name} (
        id SERIAL PRIMARY KEY,
        script_name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        finished_at TIMESTAMP WITH TIME ZONE
      )
    `)
  }

  #updateMigrationFinishedAt(scriptName: string) {
    return this.pgConnection.raw(
      `UPDATE ${this.migration_table_name} SET finished_at = CURRENT_TIMESTAMP WHERE script_name = '${scriptName}'`
    )
  }

  #deleteMigration(scriptName: string) {
    return this.pgConnection.raw(
      `DELETE FROM ${this.migration_table_name} WHERE script_name = '${scriptName}'`
    )
  }
}
