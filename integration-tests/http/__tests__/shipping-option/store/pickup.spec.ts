import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
  createAdminUser,
  generatePublishableKey,
  generateStoreHeaders,
} from "../../../../helpers/create-admin-user"

jest.setTimeout(50000)

const env = { MEDUSA_FF_MEDUSA_V2: true }
const adminHeaders = { headers: { "x-medusa-access-token": "test_token" } }

medusaIntegrationTestRunner({
  env,
  testSuite: ({ dbConnection, getContainer, api }) => {
    describe("Store: Shipping Option API", () => {
      let appContainer
      let salesChannel
      let region
      let product
      let stockLocation
      let shippingProfile
      let fulfillmentSet
      let cart
      let pickUpShippingOption
      let storeHeaders

      beforeAll(async () => {
        appContainer = getContainer()
      })

      beforeEach(async () => {
        const publishableKey = await generatePublishableKey(appContainer)
        storeHeaders = generateStoreHeaders({ publishableKey })

        await createAdminUser(dbConnection, adminHeaders, appContainer)

        region = (
          await api.post(
            "/admin/regions",
            { name: "US", currency_code: "usd", countries: ["US"] },
            adminHeaders
          )
        ).data.region

        salesChannel = (
          await api.post(
            "/admin/sales-channels",
            { name: "first channel", description: "channel" },
            adminHeaders
          )
        ).data.sales_channel

        shippingProfile = (
          await api.post(
            `/admin/shipping-profiles`,
            { name: "Test", type: "default" },
            adminHeaders
          )
        ).data.shipping_profile

        product = (
          await api.post(
            "/admin/products",
            {
              title: "Test fixture",
              shipping_profile_id: shippingProfile.id, // comment: maybe it's time to intrdocude `is_default` in the shipping profile and alos `is_pickup_default`?
              options: [
                { title: "size", values: ["large", "small"] },
                { title: "color", values: ["green"] },
              ],
              variants: [
                {
                  title: "Test variant",
                  manage_inventory: false,
                  prices: [
                    {
                      currency_code: "usd",
                      amount: 100,
                    },
                  ],
                  options: {
                    size: "large",
                    color: "green",
                  },
                },
              ],
            },
            adminHeaders
          )
        ).data.product

        stockLocation = (
          await api.post(
            `/admin/stock-locations`,
            { name: "test location" },
            adminHeaders
          )
        ).data.stock_location

        await api.post(
          `/admin/stock-locations/${stockLocation.id}/sales-channels`,
          { add: [salesChannel.id] },
          adminHeaders
        )

        const fulfillmentSets = (
          await api.post(
            `/admin/stock-locations/${stockLocation.id}/fulfillment-sets?fields=*fulfillment_sets`,
            {
              name: "Test",
              type: "pickup", // 1. Create a "pick up" fulfillment set
            },
            adminHeaders
          )
        ).data.stock_location.fulfillment_sets

        fulfillmentSet = (
          await api.post(
            `/admin/fulfillment-sets/${fulfillmentSets[0].id}/service-zones`,
            {
              name: "Service zone",
              // 2. Define granural geo zones based on zip codes
              geo_zones: [
                {
                  type: "zip",
                  country_code: "US",
                  province_code: "NY",
                  city: "New York",
                  postal_expression: { type: "regex", exp: `1000\d` }, // e.g. supporting 10001, 10002, 10003, etc.
                },
                {
                  type: "zip",
                  country_code: "US",
                  province_code: "NY",
                  city: "New York",
                  postal_expression: { type: "regex", exp: `1010\d` }, // e.g. supporting 10101, 10102, 10103, etc.
                },
              ],
            },
            adminHeaders
          )
        ).data.fulfillment_set

        await api.post(
          `/admin/stock-locations/${stockLocation.id}/fulfillment-providers`,
          {
            add: ["manual_test-provider"],
          },
          adminHeaders
        )

        // 3. Create a "pick up" shipping option that uses the manual provider (the price is 0)
        pickUpShippingOption = (
          await api.post(
            `/admin/shipping-options`,
            {
              name: "Pickup shipping option",
              service_zone_id: fulfillmentSet.service_zones[0].id,
              shipping_profile_id: shippingProfile.id,
              provider_id: "manual_test-provider",
              price_type: "flat",
              type: {
                label: "Test type",
                description: "Test description",
                code: "test-code",
              },
              prices: [
                {
                  currency_code: "usd",
                  amount: 0,
                },
              ],
              rules: [],
            },
            adminHeaders
          )
        ).data.shipping_option
      })

      describe("Pick up in store flow", () => {
        it("create and fulfill order with pick up shipping option", async () => {
          cart = (
            await api.post(
              `/store/carts`,
              {
                region_id: region.id,
                sales_channel_id: salesChannel.id,
                currency_code: "usd",
                email: "test@admin.com",
                // 4. Create address "partial" with stuff needed to validate the geo zone
                shipping_address: {
                  country_code: "US",
                  province: "NY",
                  city: "New York",
                  postal_code: "10001",
                },
                items: [
                  {
                    variant_id: product.variants[0].id,
                    quantity: 2,
                  },
                ],
              },
              storeHeaders
            )
          ).data.cart

          // 5. Add the shipping option to the cart -- validation is working properly
          await api.post(
            `/store/carts/${cart.id}/shipping-methods`,
            {
              option_id: pickUpShippingOption.id,
            },
            storeHeaders
          )

          const paymentCollection = (
            await api.post(
              `/store/payment-collections`,
              { cart_id: cart.id },
              storeHeaders
            )
          ).data.payment_collection

          await api.post(
            `/store/payment-collections/${paymentCollection.id}/payment-sessions`,
            { provider_id: "pp_system_default" },
            storeHeaders
          )

          const response = await api.post(
            `/store/carts/${cart.id}/complete`,
            {},
            storeHeaders
          )

          expect(response.status).toBe(200)
          expect(response.data.order.shipping_methods[0]).toEqual(
            expect.objectContaining({
              total: 0,
              name: "Pickup shipping option",
              shipping_option_id: pickUpShippingOption.id,
            })
          )

          const order = response.data.order

          const fulfilledOrder = (
            await api.post(
              `/admin/orders/${order.id}/fulfillments?fields=*fulfillments`,
              {
                location_id: stockLocation.id,
                items: [{ id: order.items[0].id, quantity: 1 }],
              },
              adminHeaders
            )
          ).data.order

          // 6. Fulfillment is created and packed_at is set
          expect(fulfilledOrder.fulfillments[0]).toEqual(
            expect.objectContaining({
              location_id: stockLocation.id,
              packed_at: expect.any(String),
              shipped_at: null,
              delivered_at: null,
              requires_shipping: true,
              shipping_option_id: pickUpShippingOption.id,
            })
          )
        })
      })
    })
  },
})
