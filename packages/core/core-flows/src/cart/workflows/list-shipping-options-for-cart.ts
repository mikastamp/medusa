import { deepFlatMap } from "@medusajs/framework/utils"
import {
  createWorkflow,
  transform,
  WorkflowData,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { useQueryGraphStep, validatePresenceOfStep } from "../../common"
import { useRemoteQueryStep } from "../../common/steps/use-remote-query"

export const listShippingOptionsForCartWorkflowId =
  "list-shipping-options-for-cart"
/**
 * This workflow lists the shipping options of a cart.
 */
export const listShippingOptionsForCartWorkflow = createWorkflow(
  listShippingOptionsForCartWorkflowId,
  (
    input: WorkflowData<{
      cart_id: string
      option_ids?: string[]
      is_return?: boolean
      enabled_in_store?: boolean
    }>
  ) => {
    const cartQuery = useQueryGraphStep({
      entity: "cart",
      filters: { id: input.cart_id },
      fields: [
        "id",
        "sales_channel_id",
        "currency_code",
        "region_id",
        "shipping_address.city",
        "shipping_address.country_code",
        "shipping_address.province",
        "shipping_address.postal_code",
        "item_total",
        "total",
      ],
      options: { throwIfKeyNotFound: true },
    }).config({ name: "get-cart" })

    const cart = transform({ cartQuery }, ({ cartQuery }) => cartQuery.data[0])

    validatePresenceOfStep({
      entity: cart,
      fields: ["sales_channel_id", "region_id", "currency_code"],
    })

    const scFulfillmentSetQuery = useQueryGraphStep({
      entity: "sales_channels",
      filters: { id: cart.sales_channel_id },
      fields: ["stock_locations.fulfillment_sets.id"],
    }).config({ name: "sales_channels-fulfillment-query" })

    const scFulfillmentSets = transform(
      { scFulfillmentSetQuery },
      ({ scFulfillmentSetQuery }) => scFulfillmentSetQuery.data[0]
    )

    const fulfillmentSetIds = transform(
      { options: scFulfillmentSets },
      (data) => {
        const fulfillmentSetIds = new Set<string>()

        deepFlatMap(
          data.options,
          "stock_locations.fulfillment_sets",
          ({ fulfillment_sets: fulfillmentSet }) => {
            if (fulfillmentSet?.id) {
              fulfillmentSetIds.add(fulfillmentSet.id)
            }
          }
        )

        return Array.from(fulfillmentSetIds)
      }
    )

    const queryVariables = transform(
      { input, fulfillmentSetIds, cart },
      ({ input, fulfillmentSetIds, cart }) => ({
        id: input.option_ids,

        context: {
          is_return: input.is_return ?? false,
          enabled_in_store: input.enabled_in_store ?? true,
        },

        filters: {
          fulfillment_set_id: fulfillmentSetIds,

          address: {
            country_code: cart.shipping_address?.country_code,
            province_code: cart.shipping_address?.province,
            city: cart.shipping_address?.city,
            postal_expression: cart.shipping_address?.postal_code,
          },
        },

        calculated_price: { context: cart },
      })
    )

    const shippingOptions = useRemoteQueryStep({
      entry_point: "shipping_options",
      fields: [
        "id",
        "name",
        "price_type",
        "service_zone_id",
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

        "calculated_price.*",
        "prices.*",
        "prices.price_rules.*",
      ],
      variables: queryVariables,
    }).config({ name: "shipping-options-query" })

    const shippingOptionsWithPrice = transform(
      { shippingOptions },
      ({ shippingOptions }) =>
        shippingOptions.map((shippingOption) => {
          const price = shippingOption.calculated_price

          return {
            ...shippingOption,
            amount: price?.calculated_amount,
            is_tax_inclusive: !!price?.is_calculated_price_tax_inclusive,
          }
        })
    )

    return new WorkflowResponse(shippingOptionsWithPrice)
  }
)
