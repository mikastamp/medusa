import {
  BigNumberInput,
  CalculateShippingOptionPriceDTO,
  OrderPreviewDTO,
} from "@medusajs/framework/types"
import {
  WorkflowResponse,
  createWorkflow,
  transform,
  when,
} from "@medusajs/framework/workflows-sdk"
import { ShippingOptionPriceType } from "@medusajs/framework/utils"
import { calculateShippingOptionsPricesStep } from "../../../fulfillment/steps"
import { useRemoteQueryStep } from "../../../common"

const COMMON_OPTIONS_FIELDS = [
  "id",
  "name",
  "price_type",
  "service_zone_id",
  "service_zone.fulfillment_set_id",
  "service_zone.fulfillment_set.type",
  "service_zone.fulfillment_set.location.*",
  "service_zone.fulfillment_set.location.address.*",
  "shipping_profile_id",
  "provider_id",
  "data",

  "type.id",
  "type.label",
  "type.description",
  "type.code",

  "provider.id",
  "provider.is_enabled",

  "rules.attribute",
  "rules.value",
  "rules.operator",
]

/**
 * The data to create a shipping method for an order edit.
 */
export type CreateOrderEditShippingMethodWorkflowInput = {
  /**
   * The ID of the shipping option to create the shipping method from.
   */
  shipping_option_id: string
  /**
   * The custom amount to create the shipping method with.
   * If not provided, the shipping option's amount is used.
   */
  custom_amount?: BigNumberInput | null
  /**
   * The currency code of the order.
   */
  currency_code: string
  /**
   * The ID of the order.
   */
  order_id: string
}

export const createOrderEditShippingMethodWorkflowId = "fetch-shipping-option"
/**
 * This workflows fetches a shipping option for an order (used in RMA flows).
 *
 * There can be 3 cases:
 * 1. The shipping option is a flat rate shipping option.
 *    In this case, pricing calculation context is not used.
 * 2. The shipping option is a calculated shipping option.
 *    In this case, calculate shipping price method from the provider is called.
 * 3. The shipping option is a custom shipping option. -- TODO
 *    In this case, we don't need to do caluclations above and just return the shipping option with the custom amount.
 */
export const fetchShippingOptionForOrderWorkflow = createWorkflow(
  createOrderEditShippingMethodWorkflowId,
  function (
    input: CreateOrderEditShippingMethodWorkflowInput
  ): WorkflowResponse<OrderPreviewDTO> {
    const initialOption = useRemoteQueryStep({
      entry_point: "shipping_option",
      variables: { id: input.shipping_option_id },
      fields: ["id", "price_type"],
    }).config({ name: "shipping-option-query" })

    const isCalculatedPriceShippingOption = transform(
      initialOption,
      (option) => option.price_type === ShippingOptionPriceType.CALCULATED
    )

    const calculatedPriceShippingOption = when(
      { isCalculatedPriceShippingOption },
      ({ isCalculatedPriceShippingOption }) => isCalculatedPriceShippingOption
    ).then(() => {
      const order = useRemoteQueryStep({
        entry_point: "orders",
        fields: ["id", "shipping_address", "items.*", "items.variant.*"],
        variables: { id: input.order_id },
        list: false,
        throw_if_key_not_found: true,
      }).config({ name: "order-query" })

      const shippingOptions = useRemoteQueryStep({
        entry_point: "shipping_option",
        fields: [...COMMON_OPTIONS_FIELDS],
        variables: { id: input.shipping_option_id },
      }).config({ name: "shipping-option-query" })

      const calculateShippingOptionsPricesData = transform(
        {
          shippingOptions,
          order,
          input,
        },
        ({ shippingOptions, order, input }) => {
          const so = shippingOptions[0]
          return [
            {
              id: so.id as string,
              optionData: so.data,
              context: {
                ...order,
                from_location: so.service_zone.fulfillment_set.location,
                is_return: true,
              },
              // data: {}, // TODO: add data
              provider_id: so.provider_id,
            } as CalculateShippingOptionPriceDTO,
          ]
        }
      )

      const prices = calculateShippingOptionsPricesStep(
        calculateShippingOptionsPricesData
      )

      const shippingOptionsWithPrice = transform(
        {
          shippingOptions,
          prices,
        },
        ({ shippingOptions, prices }) => {
          return {
            id: shippingOptions.id,
            name: shippingOptions.name,
            calculated_price: prices[0],
          }
        }
      )

      return shippingOptionsWithPrice
    })

    const flatRateShippingOption = when(
      { isCalculatedPriceShippingOption },
      ({ isCalculatedPriceShippingOption }) => !isCalculatedPriceShippingOption
    ).then(() => {
      const shippingOptions = useRemoteQueryStep({
        entry_point: "shipping_option",
        fields: [
          "id",
          "name",
          "calculated_price.calculated_amount",
          "calculated_price.is_calculated_price_tax_inclusive",
        ],
        variables: {
          id: input.shipping_option_id,
          calculated_price: {
            context: { currency_code: input.currency_code },
          },
        },
      }).config({ name: "fetch-shipping-option" })

      return shippingOptions[0]
    })

    const result = transform(
      {
        calculatedPriceShippingOption,
        flatRateShippingOption,
      },
      ({ calculatedPriceShippingOption, flatRateShippingOption }) => {
        return calculatedPriceShippingOption ?? flatRateShippingOption
      }
    )

    return new WorkflowResponse(result)
  }
)
