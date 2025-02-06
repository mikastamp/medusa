import { Migration } from '@mikro-orm/migrations';

export class Migration20250206092500 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`drop index if exists "order_shipping_address_id_unique";`);
    this.addSql(`drop index if exists "order_billing_address_id_unique";`);

    this.addSql(`alter table if exists "order" alter column "display_id" type int using ("display_id"::int);`);
    this.addSql(`alter table if exists "order" alter column "display_id" set not null;`);
    this.addSql(`create sequence if not exists "order_display_id_seq";`);
    this.addSql(`select setval('order_display_id_seq', (select max("display_id") from "order"));`);
    this.addSql(`alter table if exists "order" alter column "display_id" set default nextval('order_display_id_seq');`);

    this.addSql(`alter table if exists "order_change_action" alter column "ordering" type int using ("ordering"::int);`);
    this.addSql(`alter table if exists "order_change_action" alter column "ordering" set not null;`);
    this.addSql(`create sequence if not exists "order_change_action_ordering_seq";`);
    this.addSql(`select setval('order_change_action_ordering_seq', (select max("ordering") from "order_change_action"));`);
    this.addSql(`alter table if exists "order_change_action" alter column "ordering" set default nextval('order_change_action_ordering_seq');`);

    this.addSql(`drop index if exists "order_item_item_id_unique";`);

    this.addSql(`drop index if exists "return_exchange_id_unique";`);
    this.addSql(`drop index if exists "return_claim_id_unique";`);

    this.addSql(`alter table if exists "return" alter column "display_id" type int using ("display_id"::int);`);
    this.addSql(`alter table if exists "return" alter column "display_id" set not null;`);
    this.addSql(`create sequence if not exists "return_display_id_seq";`);
    this.addSql(`select setval('return_display_id_seq', (select max("display_id") from "return"));`);
    this.addSql(`alter table if exists "return" alter column "display_id" set default nextval('return_display_id_seq');`);

    this.addSql(`drop index if exists "order_exchange_order_id_unique";`);
    this.addSql(`drop index if exists "order_exchange_return_id_unique";`);

    this.addSql(`alter table if exists "order_exchange" alter column "display_id" type int using ("display_id"::int);`);
    this.addSql(`alter table if exists "order_exchange" alter column "display_id" set not null;`);
    this.addSql(`create sequence if not exists "order_exchange_display_id_seq";`);
    this.addSql(`select setval('order_exchange_display_id_seq', (select max("display_id") from "order_exchange"));`);
    this.addSql(`alter table if exists "order_exchange" alter column "display_id" set default nextval('order_exchange_display_id_seq');`);

    this.addSql(`drop index if exists "order_claim_order_id_unique";`);
    this.addSql(`drop index if exists "order_claim_return_id_unique";`);

    this.addSql(`alter table if exists "order_claim" alter column "display_id" type int using ("display_id"::int);`);
    this.addSql(`alter table if exists "order_claim" alter column "display_id" set not null;`);
    this.addSql(`create sequence if not exists "order_claim_display_id_seq";`);
    this.addSql(`select setval('order_claim_display_id_seq', (select max("display_id") from "order_claim"));`);
    this.addSql(`alter table if exists "order_claim" alter column "display_id" set default nextval('order_claim_display_id_seq');`);

    this.addSql(`drop index if exists "order_shipping_shipping_method_id_unique";`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "order" alter column "display_id" type int using ("display_id"::int);`);
    this.addSql(`alter table if exists "order" alter column "display_id" drop not null;`);
    this.addSql(`alter table if exists "order" alter column "display_id" drop default;`);
    this.addSql(`alter table if exists "order" add constraint "order_shipping_address_id_unique" unique ("shipping_address_id");`);
    this.addSql(`alter table if exists "order" add constraint "order_billing_address_id_unique" unique ("billing_address_id");`);

    this.addSql(`alter table if exists "order_change_action" alter column "ordering" type int using ("ordering"::int);`);
    this.addSql(`alter table if exists "order_change_action" alter column "ordering" drop not null;`);
    this.addSql(`alter table if exists "order_change_action" alter column "ordering" drop default;`);

    this.addSql(`alter table if exists "order_item" add constraint "order_item_item_id_unique" unique ("item_id");`);

    this.addSql(`alter table if exists "return" alter column "display_id" type int using ("display_id"::int);`);
    this.addSql(`alter table if exists "return" alter column "display_id" drop not null;`);
    this.addSql(`alter table if exists "return" alter column "display_id" drop default;`);
    this.addSql(`alter table if exists "return" add constraint "return_exchange_id_unique" unique ("exchange_id");`);
    this.addSql(`alter table if exists "return" add constraint "return_claim_id_unique" unique ("claim_id");`);

    this.addSql(`alter table if exists "order_exchange" alter column "display_id" type int using ("display_id"::int);`);
    this.addSql(`alter table if exists "order_exchange" alter column "display_id" drop not null;`);
    this.addSql(`alter table if exists "order_exchange" alter column "display_id" drop default;`);
    this.addSql(`alter table if exists "order_exchange" add constraint "order_exchange_order_id_unique" unique ("order_id");`);
    this.addSql(`alter table if exists "order_exchange" add constraint "order_exchange_return_id_unique" unique ("return_id");`);

    this.addSql(`alter table if exists "order_claim" alter column "display_id" type int using ("display_id"::int);`);
    this.addSql(`alter table if exists "order_claim" alter column "display_id" drop not null;`);
    this.addSql(`alter table if exists "order_claim" alter column "display_id" drop default;`);
    this.addSql(`alter table if exists "order_claim" add constraint "order_claim_order_id_unique" unique ("order_id");`);
    this.addSql(`alter table if exists "order_claim" add constraint "order_claim_return_id_unique" unique ("return_id");`);

    this.addSql(`alter table if exists "order_shipping" add constraint "order_shipping_shipping_method_id_unique" unique ("shipping_method_id");`);
  }

}
