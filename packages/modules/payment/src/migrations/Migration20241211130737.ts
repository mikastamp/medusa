import { Migration } from '@mikro-orm/migrations';

export class Migration20241211130737 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table if exists "payment" drop constraint if exists "payment_payment_session_id_foreign";');
    this.addSql('alter table if exists "payment" drop constraint if exists "payment_payment_collection_id_foreign";');

    this.addSql('alter table if exists "payment_session" drop constraint if exists "payment_session_payment_collection_id_foreign";');

    this.addSql('alter table if exists "payment" drop constraint if exists "payment_payment_session_id_unique";');
    this.addSql('alter table if exists "payment" add constraint "payment_payment_collection_id_foreign" foreign key ("payment_collection_id") references "payment_collection" ("id") on update cascade on delete cascade;');

    this.addSql('alter table if exists "payment_provider" add column if not exists "created_at" timestamptz not null default now(), add column if not exists "updated_at" timestamptz not null default now(), add column if not exists "deleted_at" timestamptz null;');
    this.addSql('CREATE INDEX IF NOT EXISTS "IDX_payment_provider_deleted_at" ON "payment_provider" (deleted_at) WHERE deleted_at IS NULL;');

    this.addSql('alter table if exists "payment_session" add column if not exists "payment_id" text null;');
    this.addSql('alter table if exists "payment_session" alter column "data" type jsonb using ("data"::jsonb);');
    this.addSql('alter table if exists "payment_session" alter column "data" set default \'{}\';');
    this.addSql('alter table if exists "payment_session" add constraint "payment_session_payment_id_foreign" foreign key ("payment_id") references "payment" ("id") on update cascade on delete set null;');
    this.addSql('alter table if exists "payment_session" add constraint "payment_session_payment_collection_id_foreign" foreign key ("payment_collection_id") references "payment_collection" ("id") on update cascade on delete cascade;');
    this.addSql('alter table if exists "payment_session" add constraint "payment_session_payment_id_unique" unique ("payment_id");');
    this.addSql('CREATE INDEX IF NOT EXISTS "IDX_payment_session_payment_id" ON "payment_session" (payment_id) WHERE deleted_at IS NULL;');

    this.addSql('CREATE INDEX IF NOT EXISTS "IDX_refund_reason_deleted_at" ON "refund_reason" (deleted_at) WHERE deleted_at IS NULL;');

    this.addSql('alter table if exists "refund" add constraint "refund_refund_reason_id_unique" unique ("refund_reason_id");');
  }

  async down(): Promise<void> {
    this.addSql('alter table if exists "payment_session" drop constraint if exists "payment_session_payment_id_foreign";');
    this.addSql('alter table if exists "payment_session" drop constraint if exists "payment_session_payment_collection_id_foreign";');

    this.addSql('alter table if exists "payment" drop constraint if exists "payment_payment_collection_id_foreign";');

    this.addSql('drop index if exists "IDX_payment_provider_deleted_at";');
    this.addSql('alter table if exists "payment_provider" drop column if exists "created_at";');
    this.addSql('alter table if exists "payment_provider" drop column if exists "updated_at";');
    this.addSql('alter table if exists "payment_provider" drop column if exists "deleted_at";');

    this.addSql('alter table if exists "payment_session" alter column "data" drop default;');
    this.addSql('alter table if exists "payment_session" alter column "data" type jsonb using ("data"::jsonb);');
    this.addSql('alter table if exists "payment_session" drop constraint if exists "payment_session_payment_id_unique";');
    this.addSql('drop index if exists "IDX_payment_session_payment_id";');
    this.addSql('alter table if exists "payment_session" drop column if exists "payment_id";');
    this.addSql('alter table if exists "payment_session" add constraint "payment_session_payment_collection_id_foreign" foreign key ("payment_collection_id") references "payment_collection" ("id") on update cascade;');

    this.addSql('alter table if exists "payment" add constraint "payment_payment_session_id_foreign" foreign key ("payment_session_id") references "payment_session" ("id") on update cascade;');
    this.addSql('alter table if exists "payment" add constraint "payment_payment_collection_id_foreign" foreign key ("payment_collection_id") references "payment_collection" ("id") on update cascade;');
    this.addSql('alter table if exists "payment" add constraint "payment_payment_session_id_unique" unique ("payment_session_id");');

    this.addSql('drop index if exists "IDX_refund_reason_deleted_at";');

    this.addSql('alter table if exists "refund" drop constraint if exists "refund_refund_reason_id_unique";');
  }

}
