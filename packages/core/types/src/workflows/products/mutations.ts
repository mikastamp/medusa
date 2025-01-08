import { PricingTypes, ProductTypes } from "../../bundles"

export type CreateProductVariantWorkflowInputDTO =
  ProductTypes.CreateProductVariantDTO & {
    prices?: PricingTypes.CreateMoneyAmountDTO[]
  }

export type UpdateProductVariantWorkflowInputDTO =
  ProductTypes.UpsertProductVariantDTO & {
    prices?: PricingTypes.CreateMoneyAmountDTO[]
  }

export type CreateProductWorkflowInputDTO = Omit<
  ProductTypes.CreateProductDTO,
  "variants"
> & {
  shipping_profile_id?: string
  sales_channels?: { id: string }[]
  variants?: CreateProductVariantWorkflowInputDTO[]
}

export type UpdateProductWorkflowInputDTO = ProductTypes.UpsertProductDTO & {
  sales_channels?: { id: string }[]
  shipping_profile_id?: string
}
