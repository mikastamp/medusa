import { StoreCartShippingOption } from "../../fulfillment"

export interface StoreShippingOptionListResponse {
  shipping_options: StoreCartShippingOption[]
}

export interface StoreCalculateShippingOptionPriceResponse {
  calculated_amount: number
  is_calculated_price_tax_inclusive: boolean
}
