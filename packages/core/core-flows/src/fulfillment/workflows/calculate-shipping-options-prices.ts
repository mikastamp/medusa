import { FulfillmentWorkflow } from "@medusajs/framework/types"
import {
  createWorkflow,
  transform,
  WorkflowData,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { calculateShippingOptionsPricesStep } from "../steps"
import { useQueryGraphStep } from "../../common"

export const calculateShippingOptionsPricesWorkflowId =
  "calculate-shipping-options-prices-workflow"
/**
 * This workflow calculates the prices for one or more shipping options.
 */
export const calculateShippingOptionsPricesWorkflow = createWorkflow(
  calculateShippingOptionsPricesWorkflowId,
  (
    input: WorkflowData<FulfillmentWorkflow.CalculateShippingOptionsPricesWorkflowInput>
  ): WorkflowResponse<FulfillmentWorkflow.CalculateShippingOptionsPricesWorkflowOutput> => {
    const shippingOptionsQuery = useQueryGraphStep({
      entity: "shipping_option",
      filters: { id: input.shipping_option_ids },
      fields: ["id", "provider_id", "data"],
    }).config({ name: "shipping-options-query" })

    const cartQuery = useQueryGraphStep({
      entity: "cart",
      filters: { id: input.cart_id },
      fields: ["id", "items.*", "shipping_address.*"],
    }).config({ name: "cart-query" })

    const data = transform(
      { shippingOptionsQuery, cartQuery },
      ({ shippingOptionsQuery, cartQuery }) => {
        const shippingOptions = shippingOptionsQuery.data
        const cart = cartQuery.data[0]

        return shippingOptions.map((shippingOption) => ({
          id: shippingOption.id,
          provider_id: shippingOption.provider_id,
          optionData: shippingOption.data,
          data: {},
          context: {
            cart,
          },
        }))
      }
    )

    const prices = calculateShippingOptionsPricesStep(data)

    return new WorkflowResponse(prices)
  }
)
