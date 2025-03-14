import { OrderAddress } from "../../order"

export interface AdminCreateDraftOrderItem {
  /**
   * The item's title.
   */
  title?: string | null
  /**
   * The item's variant SKU.
   */
  variant_sku?: string | null
  /**
   * The item's variant barcode.
   */
  variant_barcode?: string | null
  /**
   * The ID of the item's variant.
   */
  variant_id?: string | null
  /**
   * The item's unit price.
   */
  unit_price?: number | null
  /**
   * The item's quantity.
   */
  quantity: number
  /**
   * The item's metadata.
   */
  metadata?: Record<string, unknown> | null
}

export interface AdminCreateDraftOrderShippingMethod {
  /**
   * The ID of the shipping option.
   */
  shipping_option_id: string
}

export interface AdminCreateDraftOrder {
  /**
   * The draft order's email.
   *
   * Either email or customer_id must be provided.
   */
  email?: string | null
  /**
   * The ID of the customer to associate the draft order with.
   *
   * Either customer_id or email must be provided.
   */
  customer_id?: string | null
  /**
   * The ID of the region to associate the draft order with.
   */
  region_id: string
  /**
   * The currency code to use for the draft order.
   *
   * If not provided, the currency from the region will be used.
   */
  currency_code?: string | null
  /**
   * The promotions to apply to the draft order.
   */
  promo_codes?: string[]
  /**
   * The draft order's shipping address.
   */
  shipping_address?: OrderAddress | string
  /**
   * The draft order's billing address.
   */
  billing_address?: OrderAddress | string
  /**
   * The draft order's items.
   */
  items?: AdminCreateDraftOrderItem[]
  /**
   * The draft order's shipping methods.
   */
  shipping_methods?: AdminCreateDraftOrderShippingMethod[]
  /**
   * Whether to notify the customer about the draft order.
   */
  no_notification_order?: boolean
  /**
   * The draft order's metadata.
   */
  metadata?: Record<string, unknown> | null
}

export interface AdminUpdateDraftOrder {
  /**
   * The draft order's email.
   */
  email?: string
  /**
   * The draft order's shipping address.
   */
  shipping_address?: OrderAddress
  /**
   * The draft order's billing address.
   */
  billing_address?: OrderAddress
  /**
   * The draft order's metadata.
   */
  metadata?: Record<string, unknown> | null
}
