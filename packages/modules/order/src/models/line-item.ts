import { model } from "@medusajs/framework/utils"
import { OrderItem } from "./order-item"
import { ReturnItem } from "./return-item"
import { OrderClaimItem } from "./claim-item"
import { OrderExchangeItem } from "./exchange-item"
import { OrderLineItemTaxLine } from "./line-item-tax-line"
import { OrderLineItemAdjustment } from "./line-item-adjustment"

const _OrderLineItem = model
  .define("OrderLineItem", {
    id: model.id({ prefix: "ordli" }).primaryKey(),
    title: model.text(),
    subtitle: model.text().nullable(),
    thumbnail: model.text().nullable(),
    variant_id: model.text().nullable(),
    product_id: model.text().nullable(),
    product_title: model.text().nullable(),
    product_description: model.text().nullable(),
    product_subtitle: model.text().nullable(),
    product_type: model.text().nullable(),
    product_type_id: model.text().nullable(),
    product_collection: model.text().nullable(),
    product_handle: model.text().nullable(),
    variant_sku: model.text().nullable(),
    variant_barcode: model.text().nullable(),
    variant_title: model.text().nullable(),
    variant_option_values: model.json().nullable(),
    requires_shipping: model.boolean().default(true),
    is_discountable: model.boolean().default(true),
    is_tax_inclusive: model.boolean().default(false),
    compare_at_unit_price: model.bigNumber().nullable(),
    unit_price: model.bigNumber(),
    is_custom_price: model.boolean().default(false),
    metadata: model.json().nullable(),
    tax_lines: model.hasMany<() => typeof OrderLineItemTaxLine>(
      () => OrderLineItemTaxLine,
      {
        mappedBy: "item",
      }
    ),
    adjustments: model.hasMany<() => typeof OrderLineItemAdjustment>(
      () => OrderLineItemAdjustment,
      {
        mappedBy: "item",
      }
    ),
    items: model.hasMany<() => typeof OrderItem>(() => OrderItem, {
      mappedBy: "item",
    }),
    return_items: model.hasMany<() => typeof ReturnItem>(() => ReturnItem, {
      mappedBy: "item",
    }),
    claim_items: model.hasMany<() => typeof OrderClaimItem>(
      () => OrderClaimItem,
      {
        mappedBy: "item",
      }
    ),
    exchange_items: model.hasMany<() => typeof OrderExchangeItem>(
      () => OrderExchangeItem,
      {
        mappedBy: "item",
      }
    ),
  })
  .indexes([
    {
      name: "IDX_order_line_item_deleted_at",
      on: ["deleted_at"],
      unique: false,
      where: "deleted_at IS NOT NULL",
    },
    {
      name: "IDX_order_line_item_product_id",
      on: ["product_id"],
      unique: false,
      where: "deleted_at IS NOT NULL",
    },
    {
      name: "IDX_line_item_product_type_id",
      on: ["product_type_id"],
      unique: false,
      where: "deleted_at IS NOT NULL AND product_type_id IS NOT NULL",
    },
    {
      name: "IDX_order_line_item_variant_id",
      on: ["variant_id"],
      unique: false,
      where: "deleted_at IS NOT NULL",
    },
  ])

export const OrderLineItem = _OrderLineItem
