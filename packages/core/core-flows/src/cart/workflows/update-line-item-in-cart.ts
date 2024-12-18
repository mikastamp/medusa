import { UpdateLineItemInCartWorkflowInputDTO } from "@medusajs/framework/types"
import {
  WorkflowData,
  createWorkflow,
  transform,
} from "@medusajs/framework/workflows-sdk"
import { useQueryGraphStep } from "../../common"
import { useRemoteQueryStep } from "../../common/steps/use-remote-query"
import { updateLineItemsStepWithSelector } from "../../line-item/steps"
import { validateCartStep } from "../steps/validate-cart"
import { validateVariantPricesStep } from "../steps/validate-variant-prices"
import {
  cartFieldsForPricingContext,
  productVariantsFields,
} from "../utils/fields"
import { confirmVariantInventoryWorkflow } from "./confirm-variant-inventory"
import { refreshCartItemsWorkflow } from "./refresh-cart-items"

const cartFields = cartFieldsForPricingContext.concat(["items.*"])

export const updateLineItemInCartWorkflowId = "update-line-item-in-cart"
/**
 * This workflow updates a cart's line item.
 */
export const updateLineItemInCartWorkflow = createWorkflow(
  updateLineItemInCartWorkflowId,
  (input: WorkflowData<UpdateLineItemInCartWorkflowInputDTO>) => {
    const cartQuery = useQueryGraphStep({
      entity: "cart",
      filters: { id: input.cart_id },
      fields: cartFields,
      options: { throwIfKeyNotFound: true },
    }).config({ name: "get-cart" })

    const cart = transform({ cartQuery }, ({ cartQuery }) => cartQuery.data[0])
    const item = transform({ cart, input }, ({ cart, input }) => {
      return cart.items.find((i) => i.id === input.item_id)
    })

    validateCartStep({ cart })

    const variantIds = transform({ item }, ({ item }) => {
      return [item.variant_id]
    })

    const variants = useRemoteQueryStep({
      entry_point: "variants",
      fields: productVariantsFields,
      variables: {
        id: variantIds,
        calculated_price: {
          context: cart,
        },
      },
      throw_if_key_not_found: true,
    })

    validateVariantPricesStep({ variants })

    const items = transform({ item }, ({ item }) => {
      return [item]
    })

    confirmVariantInventoryWorkflow.runAsStep({
      input: {
        sales_channel_id: cart.sales_channel_id,
        variants,
        items,
      },
    })

    const lineItemUpdate = transform({ input, variants }, (data) => {
      const variant = data.variants[0]

      return {
        data: {
          ...data.input.update,
          unit_price: variant.calculated_price.calculated_amount,
          is_tax_inclusive:
            !!variant.calculated_price.is_calculated_price_tax_inclusive,
        },
        selector: {
          id: data.input.item_id,
        },
      }
    })

    updateLineItemsStepWithSelector(lineItemUpdate)

    refreshCartItemsWorkflow.runAsStep({
      input: { cart_id: input.cart_id },
    })
  }
)
