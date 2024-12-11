import { HttpTypes } from "@medusajs/framework/types"
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { calculateShippingOptionsPricesWorkflow } from "@medusajs/core-flows"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export const POST = async (
  req: MedusaRequest<HttpTypes.StoreCalculateShippingOptionPrice>,
  res: MedusaResponse<HttpTypes.StoreShippingOptionResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { result } = await calculateShippingOptionsPricesWorkflow(
    req.scope
  ).run({
    input: {
      shipping_options: [{ id: req.params.id, data: req.validatedBody.data }],
      cart_id: req.validatedBody.cart_id,
    },
  })

  const { data } = await query.graph({
    entity: "shipping_option",
    fields: req.remoteQueryConfig.fields,
    filters: { id: req.params.id },
  })

  const shippingOption = data[0]

  shippingOption.calculated_price = result[0]?.calculated_amount
  shippingOption.is_calculated_price_tax_inclusive =
    result[0]?.is_calculated_price_tax_inclusive

  res.status(200).json({ shipping_option: shippingOption })
}
