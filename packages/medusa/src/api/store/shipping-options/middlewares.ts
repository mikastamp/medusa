import {
  MiddlewareRoute,
  validateAndTransformBody,
} from "@medusajs/framework/http"
import { validateAndTransformQuery } from "@medusajs/framework"
import { listTransformQueryConfig } from "./query-config"
import {
  StoreCalculateShippingOptionPrice,
  StoreGetShippingOptions,
} from "./validators"

export const storeShippingOptionRoutesMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/store/shipping-options",
    middlewares: [
      validateAndTransformQuery(
        StoreGetShippingOptions,
        listTransformQueryConfig
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/store/shipping-options/:id/calculate",
    middlewares: [validateAndTransformBody(StoreCalculateShippingOptionPrice)],
  },
]
