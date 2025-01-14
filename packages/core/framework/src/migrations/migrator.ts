import { join } from "path"
import { glob } from "glob"
import { logger } from "../logger"
import { MedusaContainer } from "@medusajs/types"
import { ContainerRegistrationKeys } from "../utils"
import { Knex } from "@mikro-orm/knex"

export abstract class Migrator {
  protected abstract migration_table_name: string

  protected container: MedusaContainer
  protected pgConnection: Knex<any>

  #alreadyLoadedPaths: Map<string, any> = new Map()

  constructor({ container }: { container: MedusaContainer }) {
    this.container = container
    this.pgConnection = this.container.resolve(
      ContainerRegistrationKeys.PG_CONNECTION
    )
  }

  async ensureDatabase(): Promise<void> {
    const pgConnection = this.container.resolve(
      ContainerRegistrationKeys.PG_CONNECTION
    )

    try {
      await pgConnection.raw("SELECT 1 + 1;")
    } catch (error) {
      if (error.code === "3D000") {
        logger.error(
          `Cannot run migrations. ${error.message.replace("error: ", "")}`
        )
        logger.info(`Run command "db:create" to create the database`)
      } else {
        logger.error(error)
      }
      throw error
    }
  }

  async ensureMigrationsTable(): Promise<void> {
    try {
      // Check if table exists
      const tableExists = await this.pgConnection.raw(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public'
          AND table_name = '${this.migration_table_name}'
        );
      `)

      if (!tableExists.rows[0].exists) {
        logger.info(
          `Creating migrations table '${this.migration_table_name}'...`
        )
        await this.createMigrationTable()
        logger.info("Migrations table created successfully")
      }
    } catch (error) {
      logger.error("Failed to ensure migrations table exists:", error)
      throw error
    }
  }

  async getExecutedMigrations(): Promise<{ script_name: string }[]> {
    try {
      const result = await this.pgConnection.raw(
        `SELECT * FROM ${this.migration_table_name}`
      )
      return result.rows
    } catch (error) {
      logger.error("Failed to get executed migrations:", error)
      throw error
    }
  }

  async insertMigration(records: Record<string, any>[]): Promise<void> {
    try {
      const values = records.map((record) => Object.values(record))
      const columns = Object.keys(records[0])

      await this.pgConnection.raw(
        `INSERT INTO ${this.migration_table_name} (${columns.join(
          ", "
        )}) VALUES ${values.map((value) => `(${value.join(", ")})`).join(", ")}`
      )
    } catch (error) {
      logger.error(
        `Failed to update migration table '${this.migration_table_name}':`,
        error
      )
      throw error
    }
  }

  async loadMigrationFiles(paths: string[]): Promise<string[]> {
    const allScripts: string[] = []

    for (const basePath of paths) {
      if (this.#alreadyLoadedPaths.has(basePath)) {
        allScripts.push(...this.#alreadyLoadedPaths.get(basePath))
        continue
      }

      try {
        const scriptFiles = glob.sync("*.{js,ts}", {
          cwd: basePath,
          ignore: ["**/index.{js,ts}"],
        })

        if (!scriptFiles?.length) {
          continue
        }

        const filePaths = scriptFiles.map((script) => join(basePath, script))
        this.#alreadyLoadedPaths.set(basePath, filePaths)

        allScripts.push(...filePaths)
      } catch (error) {
        logger.error(`Failed to load migration files from ${basePath}:`, error)
        throw error
      }
    }

    return allScripts
  }

  protected abstract createMigrationTable(): Promise<void>
  abstract run(...args: any[]): Promise<any>
  abstract getPendingMigrations(migrationPaths: string[]): Promise<string[]>
}
