import { MedusaContainer } from "@medusajs/types"
import { dynamicImport } from "@medusajs/utils"
import { logger } from "../logger"
import { Migrator } from "./migrator"

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

      logger.info(`Running migration script ${script}`)
      try {
        await scriptFn.default({ container: this.container })
        await this.insertMigration([{ script_name: `'${script}'` }])
        logger.info(`Migration script ${script} completed`)
      } catch (error) {
        logger.error(`Failed to run migration script ${script}:`, error)
        throw error
      }
    }
  }

  async getPendingMigrations(migrationPaths: string[]): Promise<string[]> {
    const executedMigrations = new Set(
      (await this.getExecutedMigrations()).map((item) => item.script_name)
    )
    const all = await this.loadMigrationFiles(migrationPaths)

    return all.filter((item) => !executedMigrations.has(item))
  }

  protected async createMigrationTable(): Promise<void> {
    await this.pgConnection.raw(`
      CREATE TABLE IF NOT EXISTS ${this.migration_table_name} (
        id SERIAL PRIMARY KEY,
        script_name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `)
  }
}
