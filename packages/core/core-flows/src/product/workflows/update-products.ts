import { updateProductsStep } from "../steps/update-products"

import {
  AdditionalData,
  CreateMoneyAmountDTO,
  ProductTypes,
  UpdateProductVariantWorkflowInputDTO,
} from "@medusajs/framework/types"
import {
  Modules,
  ProductWorkflowEvents,
  arrayDifference,
} from "@medusajs/framework/utils"
import {
  WorkflowData,
  WorkflowResponse,
  createHook,
  createWorkflow,
  parallelize,
  transform,
} from "@medusajs/framework/workflows-sdk"
import {
  createRemoteLinkStep,
  dismissRemoteLinkStep,
  emitEventStep,
  useRemoteQueryStep,
} from "../../common"
import { upsertVariantPricesWorkflow } from "./upsert-variant-prices"

export type UpdateProductsWorkflowInputSelector = {
  selector: ProductTypes.FilterableProductProps
  update: Omit<ProductTypes.UpdateProductDTO, "variants"> & {
    sales_channels?: { id: string }[]
    shipping_profile_id?: string
    variants?: UpdateProductVariantWorkflowInputDTO[]
  }
} & AdditionalData

export type UpdateProductsWorkflowInputProducts = {
  products: (Omit<ProductTypes.UpsertProductDTO, "variants"> & {
    sales_channels?: { id: string }[]
    shipping_profile_id?: string
    variants?: UpdateProductVariantWorkflowInputDTO[]
  })[]
} & AdditionalData

export type UpdateProductWorkflowInput =
  | UpdateProductsWorkflowInputSelector
  | UpdateProductsWorkflowInputProducts

function prepareUpdateProductInput({
  input,
}: {
  input: UpdateProductWorkflowInput
}): UpdateProductWorkflowInput {
  if ("products" in input) {
    if (!input.products.length) {
      return { products: [] }
    }

    return {
      products: input.products.map((p) => ({
        ...p,
        sales_channels: undefined,
        shipping_profile_id: undefined,
        variants: p.variants?.map((v) => ({
          ...v,
          prices: undefined,
        })),
      })),
    }
  }

  return {
    selector: input.selector,
    update: {
      ...input.update,
      sales_channels: undefined,
      shipping_profile_id: undefined,
      variants: input.update?.variants?.map((v) => ({
        ...v,
        prices: undefined,
      })),
    },
  }
}

// This helper finds the IDs of products that have associated sales channels.
function findProductsWithSalesChannels({
  updatedProducts,
  input,
}: {
  updatedProducts: ProductTypes.ProductDTO[]
  input: UpdateProductWorkflowInput
}) {
  let productIds = updatedProducts.map((p) => p.id)

  if ("products" in input) {
    const discardedProductIds: string[] = input.products
      .filter((p) => !p.sales_channels)
      .map((p) => p.id as string)
    return arrayDifference(productIds, discardedProductIds)
  }

  return !input.update?.sales_channels ? [] : productIds
}

function findProductsWithShippingProfile({
  updatedProducts,
  input,
}: {
  updatedProducts: ProductTypes.ProductDTO[]
  input: UpdateProductWorkflowInput
}) {
  let productIds = updatedProducts.map((p) => p.id)

  if ("products" in input) {
    const discardedProductIds: string[] = input.products
      .filter((p) => !p.shipping_profile_id)
      .map((p) => p.id as string)
    return arrayDifference(productIds, discardedProductIds)
  }

  return !input.update?.shipping_profile_id ? [] : productIds
}

function prepareSalesChannelLinks({
  input,
  updatedProducts,
}: {
  updatedProducts: ProductTypes.ProductDTO[]
  input: UpdateProductWorkflowInput
}): Record<string, Record<string, any>>[] {
  if ("products" in input) {
    if (!input.products.length) {
      return []
    }

    return input.products
      .filter((p) => p.sales_channels)
      .flatMap((p) =>
        p.sales_channels!.map((sc) => ({
          [Modules.PRODUCT]: {
            product_id: p.id,
          },
          [Modules.SALES_CHANNEL]: {
            sales_channel_id: sc.id,
          },
        }))
      )
  }

  if (input.selector && input.update?.sales_channels?.length) {
    return updatedProducts.flatMap((p) =>
      input.update.sales_channels!.map((channel) => ({
        [Modules.PRODUCT]: {
          product_id: p.id,
        },
        [Modules.SALES_CHANNEL]: {
          sales_channel_id: channel.id,
        },
      }))
    )
  }

  return []
}

function prepareShippingProfileLinks({
  input,
  updatedProducts,
}: {
  updatedProducts: ProductTypes.ProductDTO[]
  input: UpdateProductWorkflowInput
}): Record<string, Record<string, any>>[] {
  if ("products" in input) {
    if (!input.products.length) {
      return []
    }

    return input.products
      .filter((p) => p.shipping_profile_id)
      .map((p) => ({
        [Modules.PRODUCT]: {
          product_id: p.id,
        },
        [Modules.FULFILLMENT]: {
          shipping_profile_id: p.shipping_profile_id,
        },
      }))
  }

  if (input.selector && input.update?.shipping_profile_id) {
    return updatedProducts.map((p) => ({
      [Modules.PRODUCT]: {
        product_id: p.id,
      },
      [Modules.FULFILLMENT]: {
        shipping_profile_id: input.update.shipping_profile_id,
      },
    }))
  }

  return []
}

function prepareVariantPrices({
  input,
  updatedProducts,
}: {
  updatedProducts: ProductTypes.ProductDTO[]
  input: UpdateProductWorkflowInput
}): {
  variant_id: string
  product_id: string
  prices?: CreateMoneyAmountDTO[]
}[] {
  if ("products" in input) {
    if (!input.products.length) {
      return []
    }

    // Note: We rely on the ordering of input and update here.
    return input.products.flatMap((product, i) => {
      if (!product.variants?.length) {
        return []
      }

      const updatedProduct = updatedProducts[i]
      return product.variants.map((variant, j) => {
        const updatedVariant = updatedProduct.variants[j]

        return {
          product_id: updatedProduct.id,
          variant_id: updatedVariant.id,
          prices: variant.prices,
        }
      })
    })
  }

  if (input.selector && input.update?.variants?.length) {
    return updatedProducts.flatMap((p) => {
      return input.update.variants!.map((variant, i) => ({
        product_id: p.id,
        variant_id: p.variants[i].id,
        prices: variant.prices,
      }))
    })
  }

  return []
}

function prepareToDeleteSalesChannelLinks({
  currentSalesChannelLinks,
}: {
  currentSalesChannelLinks: {
    product_id: string
    sales_channel_id: string
  }[]
}) {
  if (!currentSalesChannelLinks.length) {
    return []
  }

  return currentSalesChannelLinks.map(({ product_id, sales_channel_id }) => ({
    [Modules.PRODUCT]: {
      product_id,
    },
    [Modules.SALES_CHANNEL]: {
      sales_channel_id,
    },
  }))
}

function prepareToDeleteShippingProfileLinks({
  currentShippingProfileLinks,
}: {
  currentShippingProfileLinks: {
    product_id: string
    shipping_profile_id: string
  }[]
}) {
  if (!currentShippingProfileLinks.length) {
    return []
  }

  return currentShippingProfileLinks.map(
    ({ product_id, shipping_profile_id }) => ({
      [Modules.PRODUCT]: {
        product_id,
      },
      [Modules.FULFILLMENT]: {
        shipping_profile_id,
      },
    })
  )
}

export const updateProductsWorkflowId = "update-products"
/**
 * This workflow updates one or more products.
 */
export const updateProductsWorkflow = createWorkflow(
  updateProductsWorkflowId,
  (input: WorkflowData<UpdateProductWorkflowInput>) => {
    // We only get the variant ids of products that are updating the variants and prices.
    const variantIdsSelector = transform({ input }, (data) => {
      if ("products" in data.input) {
        return {
          filters: {
            id: data.input.products
              .filter((p) => !!p.variants)
              .map((p) => p.id),
          },
        }
      }

      return {
        filters: data.input.update?.variants ? data.input.selector : { id: [] },
      }
    })
    const previousProductsWithVariants = useRemoteQueryStep({
      entry_point: "product",
      fields: ["variants.id"],
      variables: variantIdsSelector,
    }).config({ name: "get-previous-products-variants-step" })

    const previousVariantIds = transform(
      { previousProductsWithVariants },
      (data) => {
        return data.previousProductsWithVariants.flatMap((p) =>
          p.variants?.map((v) => v.id)
        )
      }
    )

    const toUpdateInput = transform({ input }, prepareUpdateProductInput)
    const updatedProducts = updateProductsStep(toUpdateInput)

    const salesChannelLinks = transform(
      { input, updatedProducts },
      prepareSalesChannelLinks
    )

    const shippingProfileLinks = transform(
      { input, updatedProducts },
      prepareShippingProfileLinks
    )

    const variantPrices = transform(
      { input, updatedProducts },
      prepareVariantPrices
    )

    const productsWithSalesChannels = transform(
      { updatedProducts, input },
      findProductsWithSalesChannels
    )

    const productsWithShippingProfile = transform(
      { updatedProducts, input },
      findProductsWithShippingProfile
    )

    const currentSalesChannelLinks = useRemoteQueryStep({
      entry_point: "product_sales_channel",
      fields: ["product_id", "sales_channel_id"],
      variables: { filters: { product_id: productsWithSalesChannels } },
    }).config({ name: "get-current-sales-channel-links-step" })

    const currentShippingProfileLinks = useRemoteQueryStep({
      entry_point: "product_shipping_profile",
      fields: ["product_id", "shipping_profile_id"],
      variables: { filters: { product_id: productsWithShippingProfile } },
    }).config({ name: "get-current-shipping-profile-links-step" })

    const toDeleteSalesChannelLinks = transform(
      { currentSalesChannelLinks },
      prepareToDeleteSalesChannelLinks
    )

    const toDeleteShippingProfileLinks = transform(
      { currentShippingProfileLinks },
      prepareToDeleteShippingProfileLinks
    )

    upsertVariantPricesWorkflow.runAsStep({
      input: { variantPrices, previousVariantIds },
    })

    dismissRemoteLinkStep(toDeleteSalesChannelLinks).config({
      name: "delete-sales-channel-links-step",
    })

    dismissRemoteLinkStep(toDeleteShippingProfileLinks).config({
      name: "delete-shipping-profile-links-step",
    })

    const productIdEvents = transform(
      { updatedProducts },
      ({ updatedProducts }) => {
        return updatedProducts?.map((p) => {
          return { id: p.id }
        })
      }
    )

    parallelize(
      createRemoteLinkStep(salesChannelLinks).config({
        name: "create-sales-channel-links-step",
      }),
      createRemoteLinkStep(shippingProfileLinks).config({
        name: "create-shipping-profile-links-step",
      }),
      emitEventStep({
        eventName: ProductWorkflowEvents.UPDATED,
        data: productIdEvents,
      })
    )

    const productsUpdated = createHook("productsUpdated", {
      products: updatedProducts,
      additional_data: input.additional_data,
    })

    return new WorkflowResponse(updatedProducts, {
      hooks: [productsUpdated],
    })
  }
)
