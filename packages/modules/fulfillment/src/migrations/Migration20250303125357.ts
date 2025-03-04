import { Migration } from "@mikro-orm/migrations"

export class Migration20250303125357 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table if exists "fulfillment" alter column "location_id" type text using ("location_id"::text);`
    )
    this.addSql(
      `alter table if exists "fulfillment" alter column "location_id" drop not null;`
    )
  }

  override async down(): Promise<void> {
    this.addSql(
      `alter table if exists "fulfillment" alter column "location_id" type text using ("location_id"::text);`
    )
    this.addSql(
      `alter table if exists "fulfillment" alter column "location_id" set not null;`
    )
  }
}
