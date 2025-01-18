import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

export default async function assignProductsToShippingProfile({
  container,
}: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const link = container.resolve(ContainerRegistrationKeys.LINK)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const fulfillmentService = container.resolve(Modules.FULFILLMENT)

  const shippingProfiles = await query.graph({
    entity: "shipping_profile",
    fields: ["id", "name"],
  })

  let shippingProfileId: string | null = null

  if (!shippingProfiles.data.length) {
    logger.info(
      "No shipping profiles found, creating a default shipping profile"
    )

    const shippingProfile = await fulfillmentService.createShippingProfiles({
      name: "Default Shipping Profile",
      type: "default",
    })

    shippingProfileId = shippingProfile.id
  } else {
    shippingProfileId = (
      shippingProfiles.data.find((p) =>
        p.name.toLocaleLowerCase().includes("default")
      ) || shippingProfiles.data[0]
    ).id
  }

  const products = await query.graph({
    entity: "product",
    fields: ["id"],
  })

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
