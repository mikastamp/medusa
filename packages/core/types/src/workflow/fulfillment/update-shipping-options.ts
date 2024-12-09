import { RuleOperatorType } from "../../common"
import { PriceRule } from "../../pricing"

export type UpdateShippingOptionsWorkflowInput = {
  id: string
  name?: string
  service_zone_id?: string
  shipping_profile_id?: string
  data?: Record<string, unknown>
  provider_id?: string
  type?: {
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
  | { price_type?: "calculated" }
  | {
      price_type?: "flat"
      prices?: UpdateShippingOptionPriceRecord[]
    }
)

export type UpdateShippingOptionPriceRecord =
  | {
      id?: string
      currency_code?: string
      amount?: number
      rules?: PriceRule[]
    }
  | {
      id?: string
      region_id?: string
      amount?: number
      rules?: PriceRule[]
    }

export type UpdateShippingOptionsWorkflowOutput = {
  id: string
}[]
