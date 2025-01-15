import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

export default async function assignProductsToShippingProfile({
  container,
}: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const link = container.resolve(ContainerRegistrationKeys.LINK)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const shippingProfiles = await query.graph({
    entity: "shipping_profile",
    fields: ["id", "name"],
  })

  if (!shippingProfiles.data.length) {
    logger.error(
      "No shipping profiles found, please create a default shipping profile first"
    )
  }

  const products = await query.graph({
    entity: "product",
    fields: ["id"],
  })

  const shippingProfileId = (
    shippingProfiles.data.find((p) =>
      p.name.toLocaleLowerCase().includes("default")
    ) || shippingProfiles.data[0]
  ).id

  const links = products.data.map((product) => ({
    [Modules.PRODUCT]: {
      product_id: product.id,
    },
    [Modules.FULFILLMENT]: {
      shipping_profile_id: shippingProfileId,
    },
  }))

  await link.create(links)

  logger.info("Products assigned to shipping profile")
}
