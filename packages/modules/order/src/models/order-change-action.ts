import { model } from "@medusajs/framework/utils"

import { OrderClaim } from "./claim"
import { OrderExchange } from "./exchange"
import { Order } from "./order"
import { OrderChange } from "./order-change"
import { Return } from "./return"

const _OrderChangeAction = model
  .define("OrderChangeAction", {
    id: model.id({ prefix: "ordchact" }).primaryKey(),
    ordering: model.autoincrement(),
    version: model.number().nullable(),
    reference: model.text().nullable(),
    reference_id: model.text().nullable(),
    action: model.text(),
    details: model.json().default({}),
    amount: model.bigNumber().nullable(),
    internal_note: model.text().nullable(),
    applied: model.boolean().default(false),
    order: model.hasOne<() => typeof OrderChange>(() => Order, {
      mappedBy: undefined,
      foreignKey: true,
    }),
    return: model
      .hasOne<() => typeof Return>(() => Return, {
        mappedBy: undefined,
        foreignKey: true,
      })
      .nullable(),
    claim: model
      .hasOne<() => typeof OrderClaim>(() => OrderClaim, {
        mappedBy: undefined,
        foreignKey: true,
      })
      .nullable(),
    exchange: model
      .hasOne<() => typeof OrderExchange>(() => OrderExchange, {
        mappedBy: undefined,
        foreignKey: true,
      })
      .nullable(),
    order_change: model
      .belongsTo<() => typeof OrderChange>(() => OrderChange, {
        mappedBy: "actions",
      })
      .nullable(),
  })
  .indexes([
    {
      name: "IDX_order_change_action_order_change_id",
      on: ["order_change_id"],
      unique: false,
      where: "deleted_at IS NOT NULL",
    },
    {
      name: "IDX_order_change_action_order_id",
      on: ["order_id"],
      unique: false,
      where: "deleted_at IS NOT NULL",
    },
    {
      name: "IDX_order_change_action_return_id",
      on: ["return_id"],
      unique: false,
      where: "return_id IS NOT NULL AND deleted_at IS NOT NULL",
    },
    {
      name: "IDX_order_change_action_claim_id",
      on: ["claim_id"],
      unique: false,
      where: "claim_id IS NOT NULL AND deleted_at IS NOT NULL",
    },
    {
      name: "IDX_order_change_action_exchange_id",
      on: ["exchange_id"],
      unique: false,
      where: "exchange_id IS NOT NULL AND deleted_at IS NOT NULL",
    },
    {
      name: "IDX_order_change_action_deleted_at",
      on: ["deleted_at"],
      unique: false,
      where: "deleted_at IS NOT NULL",
    },
    {
      name: "IDX_order_change_action_ordering",
      on: ["ordering"],
      unique: false,
      where: "deleted_at IS NOT NULL",
    },
  ])

export const OrderChangeAction = _OrderChangeAction
