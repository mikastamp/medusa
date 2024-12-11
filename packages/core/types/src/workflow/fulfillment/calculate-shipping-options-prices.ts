import { CalculatedShippingOptionPrice } from "../../fulfillment"

export type CalculateShippingOptionsPricesWorkflowInput = {
  cart_id: string
  shipping_option_id: string
}[]

export type CalculateShippingOptionsPricesWorkflowOutput =
  CalculatedShippingOptionPrice[]
