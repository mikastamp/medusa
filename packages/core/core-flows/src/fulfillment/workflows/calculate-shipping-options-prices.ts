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
      filters: { id: input.map((i) => i.shipping_option_id) },
      fields: ["id", "provider_id", "data"],
    })

    const data = transform(
      { shippingOptionsQuery },
      ({ shippingOptionsQuery }) => {
        const shippingOptions = shippingOptionsQuery.data

        return shippingOptions.map((shippingOption) => ({
          id: shippingOption.id,
          provider_id: shippingOption.provider_id,
          data: shippingOption.data,
          context: {
            cart: {
              id: shippingOption.cart_id,
            },
          },
        }))
      }
    )

    const prices = calculateShippingOptionsPricesStep(data)

    return new WorkflowResponse(prices)
  }
)
