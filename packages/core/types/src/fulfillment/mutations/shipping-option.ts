import { CreateShippingOptionTypeDTO } from "./shipping-option-type"
import { ShippingOptionPriceType } from "../common"
import { CreateShippingOptionRuleDTO } from "./shipping-option-rule"
import { CartDTO } from "../../cart"

/**
 * The shipping option to be created.
 */
export interface CreateShippingOptionDTO {
  /**
   * The name of the shipping option.
   */
  name: string

  /**
   * The type of the shipping option's price.
   */
  price_type: ShippingOptionPriceType

  /**
   * The associated service zone's ID.
   */
  service_zone_id: string

  /**
   * The associated shipping profile's ID.
   */
  shipping_profile_id: string

  /**
   * The associated provider's ID.
   */
  provider_id: string

  /**
   * The shipping option type associated with the shipping option.
   */
  type: Omit<CreateShippingOptionTypeDTO, "shipping_option_id">

  /**
   * The data necessary for the associated fulfillment provider to process the shipping option
   * and its associated fulfillments.
   */
  data?: Record<string, unknown> | null

  /**
   * The shipping option rules associated with the shipping option.
   */
  rules?: Omit<CreateShippingOptionRuleDTO, "shipping_option_id">[]
}

/**
 * The attributes to update in the shipping option.
 */
export interface UpdateShippingOptionDTO {
  /**
   * The ID of the shipping option.
   */
  id?: string

  /**
   * The name of the shipping option.
   */
  name?: string

  /**
   * The type of the shipping option's price.
   */
  price_type?: ShippingOptionPriceType

  /**
   * The associated service zone's ID.
   */
  service_zone_id?: string

  /**
   * The associated shipping profile's ID.
   */
  shipping_profile_id?: string

  /**
   * The associated provider's ID.
   */
  provider_id?: string

  /**
   * The shipping option type associated with the shipping option.
   */
  type:
    | Omit<CreateShippingOptionTypeDTO, "shipping_option_id">
    | {
        /**
         * The ID of the shipping option type.
         */
        id: string
      }

  /**
   * The data necessary for the associated fulfillment provider to process the shipping option
   * and its associated fulfillments.
   */
  data?: Record<string, unknown> | null

  /**
   * The shipping option rules associated with the shipping option.
   */
  rules?: (
    | Omit<CreateShippingOptionRuleDTO, "shipping_option_id">
    | {
        /**
         * The ID of the shipping option rule.
         */
        id: string
      }
  )[]
}

/**
 * A shipping option to be created or updated.
 */
export interface UpsertShippingOptionDTO extends UpdateShippingOptionDTO {}

/**
 * The data needed for the associated fulfillment provider to calculate the price of a shipping option.
 */
export interface CalculateShippingOptionPriceDTO {
  /**
   * The ID of the shipping option.
   */
  id: string

  /**
   * The ID of the fulfillment provider.
   */
  provider_id: string

  /**
   * The option data from the provider.
   */
  optionData: Record<string, unknown>

  /**
   * Additional data passed when the price is calculated.
   *
   * @example
   * When calculating the price for a shipping option upon creation of a shipping method additional data can be passed
   * to the provider.
   */
  data: Record<string, unknown>

  /**
   * The calculation context needed for the associated fulfillment provider to calculate the price of a shipping option.
   */
  context: {
    cart: Pick<CartDTO, "id" | "items" | "shipping_address" | "email">
  } & Record<string, unknown>
}
