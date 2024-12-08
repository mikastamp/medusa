import { ShippingOptionDTO } from "../../fulfillment"
import { RuleOperatorType } from "../../common"

export type CreateShippingOptionsWorkflowInput = {
  name: string
  service_zone_id: string
  shipping_profile_id: string
  data?: Record<string, unknown>
  provider_id: string
  type: {
    label: string
    description: string
    code: string
  }
  rules?: {
    attribute: string
    operator: RuleOperatorType
    value: string | string[]
  }[]
} & (
  | { price_type: "calculated" }
  | {
      price_type: "flat"
      prices: (
        | {
            currency_code: string
            amount: number
          }
        | {
            region_id: string
            amount: number
          }
      )[]
    }
)

export type CreateShippingOptionsWorkflowOutput = ShippingOptionDTO[]
