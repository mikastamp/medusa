import { UpdateLineItemInCartWorkflowInputDTO } from "@medusajs/framework/types"
import {
  WorkflowData,
  createWorkflow,
  transform,
} from "@medusajs/framework/workflows-sdk"
import { useRemoteQueryStep } from "../../common/steps/use-remote-query"
import { updateLineItemsStepWithSelector } from "../../line-item/steps"
import { validateCartStep } from "../steps/validate-cart"
import { validateVariantPricesStep } from "../steps/validate-variant-prices"
import { productVariantsFields } from "../utils/fields"
import { confirmVariantInventoryWorkflow } from "./confirm-variant-inventory"
import { refreshCartItemsWorkflow } from "./refresh-cart-items"

export const updateLineItemInCartWorkflowId = "update-line-item-in-cart"
/**
 * This workflow updates a cart's line item.
 */
export const updateLineItemInCartWorkflow = createWorkflow(
  updateLineItemInCartWorkflowId,
  (input: WorkflowData<UpdateLineItemInCartWorkflowInputDTO>) => {
    validateCartStep(input)

    const variantIds = transform({ input }, (data) => {
      return [data.input.item.variant_id]
    })

    // TODO: This is on par with the context used in v1.*, but we can be more flexible.
    const pricingContext = transform({ cart: input.cart }, (data) => {
      return {
        currency_code: data.cart.currency_code,
        region_id: data.cart.region_id,
        customer_id: data.cart.customer_id,
      }
    })

    const variants = useRemoteQueryStep({
      entry_point: "variants",
      fields: productVariantsFields,
      variables: {
        id: variantIds,
        calculated_price: {
          context: pricingContext,
        },
      },
      throw_if_key_not_found: true,
    })

    validateVariantPricesStep({ variants })

    const items = transform({ input }, (data) => {
      return [data.input.item]
    })

    confirmVariantInventoryWorkflow.runAsStep({
      input: {
        sales_channel_id: input.cart.sales_channel_id as string,
        variants,
        items,
      },
    })

    const lineItemUpdate = transform({ input, variants }, (data) => {
      const variant = data.variants[0]
      const item = data.input.item

      return {
        data: {
          ...data.input.update,
          unit_price: variant.calculated_price.calculated_amount,
          is_tax_inclusive:
            !!variant.calculated_price.is_calculated_price_tax_inclusive,
        },
        selector: {
          id: item.id,
        },
      }
    })

    updateLineItemsStepWithSelector(lineItemUpdate)

    refreshCartItemsWorkflow.runAsStep({
      input: { cart_id: input.cart.id },
    })
  }
)
