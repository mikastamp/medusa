import { Migration } from "@mikro-orm/migrations"

export class Migration20250206102615 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table if exists "order_item" drop constraint if exists "order_item_item_id_unique";`
    )

    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_order_item_item_id_unique" ON "order_item" (item_id) WHERE deleted_at IS NULL;`
    )
  }

  override async down(): Promise<void> {
    this.addSql(`drop index if exists "IDX_order_item_item_id_unique";`)
  }
}
