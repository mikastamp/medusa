import { HttpTypes } from "@medusajs/framework/types"
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { calculateShippingOptionsPricesWorkflow } from "@medusajs/core-flows"

import { StoreCalculateShippingOptionPriceType } from "../../validators"

export const POST = async (
  req: MedusaRequest<StoreCalculateShippingOptionPriceType>,
  res: MedusaResponse<HttpTypes.StoreCalculateShippingOptionPriceResponse>
) => {
  const { result } = await calculateShippingOptionsPricesWorkflow(
    req.scope
  ).run({
    input: {
      shipping_option_ids: [req.params.id],
      cart_id: req.validatedBody.cart_id,
    },
  })

  res.status(200).json(result[0])
}
