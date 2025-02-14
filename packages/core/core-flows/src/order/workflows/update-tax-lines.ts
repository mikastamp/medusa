import { OrderWorkflowDTO } from "@medusajs/framework/types"
import {
  WorkflowData,
  createWorkflow,
  transform,
} from "@medusajs/framework/workflows-sdk"
import { useRemoteQueryStep } from "../../common"
import { getItemTaxLinesStep } from "../../tax/steps/get-item-tax-lines"
import { setOrderTaxLinesForItemsStep } from "../steps"

const completeOrderFields = [
  "id",
  "currency_code",
  "email",
  "region.id",
  "region.automatic_taxes",
  "items.id",
  "items.is_tax_inclusive",
  "items.variant_id",
  "items.product_id",
  "items.product_title",
  "items.product_description",
  "items.product_subtitle",
  "items.product_type",
  "items.product_collection",
  "items.product_handle",
  "items.variant_sku",
  "items.variant_barcode",
  "items.variant_title",
  "items.title",
  "items.quantity",
  "items.unit_price",
  "items.tax_lines.id",
  "items.tax_lines.description",
  "items.tax_lines.code",
  "items.tax_lines.rate",
  "items.tax_lines.provider_id",
  "shipping_methods.id",
  "shipping_methods.is_tax_inclusive",
  "shipping_methods.shipping_option_id",
  "shipping_methods.amount",
  "shipping_methods.tax_lines.id",
  "shipping_methods.tax_lines.description",
  "shipping_methods.tax_lines.code",
  "shipping_methods.tax_lines.rate",
  "shipping_methods.tax_lines.provider_id",
  "customer.id",
  "customer.email",
  "customer.groups.id",
  "shipping_address.id",
  "shipping_address.address_1",
  "shipping_address.address_2",
  "shipping_address.city",
  "shipping_address.postal_code",
  "shipping_address.country_code",
  "shipping_address.region_code",
  "shipping_address.province",
]

/**
 * The data to update the order's tax lines.
 */
export type UpdateOrderTaxLinesWorkflowInput = {
  /**
   * The ID of the order to update.
   */
  order_id: string
  /**
   * The IDs of the items to update the tax lines for.
   */
  item_ids?: string[]
  /**
   * The IDs of the shipping methods to update the tax lines for.
   */
  shipping_method_ids?: string[]
  /**
   * Whether to force the tax calculation. If enabled, the tax provider
   * may send request to a third-party service to retrieve the calculated
   * tax rates. This depends on the chosen tax provider in the order's tax region.
   */
  force_tax_calculation?: boolean
  /**
   * Whether to calculate the tax lines for a return.
   */
  is_return?: boolean
  /**
   * The shipping address to use for the tax calculation.
   */
  shipping_address?: OrderWorkflowDTO["shipping_address"]
}

export const updateOrderTaxLinesWorkflowId = "update-order-tax-lines"
/**
 * This workflow updates the tax lines of items and shipping methods in an order. It's used by
 * other order-related workflows, such as the {@link createOrderWorkflow} to set the order's
 * tax lines.
 *
 * You can use this workflow within your customizations or your own custom workflows, allowing you to update an
 * order's tax lines in your custom flows.
 *
 * @example
 * const { result } = await updateOrderTaxLinesWorkflow(container)
 * .run({
 *   input: {
 *     order_id: "order_123",
 *     item_ids: ["orli_123", "orli_456"],
 *   }
 * })
 *
 * @summary
 *
 * Update the tax lines of items and shipping methods in an order.
 */
export const updateOrderTaxLinesWorkflow = createWorkflow(
  updateOrderTaxLinesWorkflowId,
  (
    input: WorkflowData<UpdateOrderTaxLinesWorkflowInput>
  ): WorkflowData<void> => {
    const order = useRemoteQueryStep({
      entry_point: "order",
      fields: completeOrderFields,
      variables: { id: input.order_id },
      list: false,
    })

    const taxLineItems = getItemTaxLinesStep(
      transform({ input, order }, (data) => {
        return {
          orderOrCart: data.order,
          items: data.order.items,
          shipping_methods: data.order.shipping_methods,
          force_tax_calculation: data.input.force_tax_calculation,
          is_return: data.input.is_return ?? false,
          shipping_address: data.input.shipping_address,
        }
      })
    )

    setOrderTaxLinesForItemsStep({
      order,
      item_tax_lines: taxLineItems.lineItemTaxLines,
      shipping_tax_lines: taxLineItems.shippingMethodsTaxLines,
    })
  }
)
