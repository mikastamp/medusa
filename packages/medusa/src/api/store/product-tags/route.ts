import { StoreProductTagListResponse } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { StoreProductTagsParamsType } from "./validators"

export const GET = async (
  req: AuthenticatedMedusaRequest<StoreProductTagsParamsType>,
  res: MedusaResponse<StoreProductTagListResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: product_tags, metadata } = await query.graph({
    entity: "product_tag",
    filters: req.filterableFields,
    pagination: req.queryConfig.pagination,
    fields: req.queryConfig.fields,
  })

  res.json({
    product_tags,
    count: metadata?.count,
    offset: metadata?.skip,
    limit: metadata?.take,
  })
}
