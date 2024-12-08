import { FulfillmentWorkflow } from "@medusajs/framework/types"
import {
  createWorkflow,
  parallelize,
  transform,
  WorkflowData,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { ShippingOptionPriceType } from "@medusajs/framework/utils"
import {
  setShippingOptionsPricesStep,
  upsertShippingOptionsStep,
} from "../steps"
import { validateFulfillmentProvidersStep } from "../steps/validate-fulfillment-providers"
import { validateShippingOptionPricesStep } from "../steps/validate-shipping-option-prices"

export const updateShippingOptionsWorkflowId =
  "update-shipping-options-workflow"
/**
 * This workflow updates one or more shipping options.
 */
export const updateShippingOptionsWorkflow = createWorkflow(
  updateShippingOptionsWorkflowId,
  (
    input: WorkflowData<
      FulfillmentWorkflow.UpdateShippingOptionsWorkflowInput[]
    >
  ): WorkflowResponse<FulfillmentWorkflow.UpdateShippingOptionsWorkflowOutput> => {
    parallelize(
      validateFulfillmentProvidersStep(input),
      validateShippingOptionPricesStep(input)
    )

    const data = transform(input, (data) => {
      const shippingOptionsIndexToPrices = data
        .filter((option) => option.price_type === ShippingOptionPriceType.FLAT)
        .map((option, index) => {
          const prices = (option as any).prices
          delete (option as any).prices

          return {
            shipping_option_index: index,
            prices,
          }
        })

      return {
        shippingOptions: data,
        shippingOptionsIndexToPrices,
      }
    })

    const updatedShippingOptions = upsertShippingOptionsStep(
      data.shippingOptions
    )

    const normalizedShippingOptionsPrices = transform(
      {
        shippingOptions: updatedShippingOptions,
        shippingOptionsIndexToPrices: data.shippingOptionsIndexToPrices,
      },
      (data) => {
        const flatRateShippingOptions = data.shippingOptions.filter(
          (option) => option.price_type === ShippingOptionPriceType.FLAT
        )

        const shippingOptionsPrices = data.shippingOptionsIndexToPrices.map(
          ({ shipping_option_index, prices }) => {
            return {
              id: flatRateShippingOptions[shipping_option_index].id,
              prices,
            }
          }
        )

        return {
          shippingOptionsPrices,
        }
      }
    )

    setShippingOptionsPricesStep(
      normalizedShippingOptionsPrices.shippingOptionsPrices
    )

    return new WorkflowResponse(updatedShippingOptions)
  }
)
