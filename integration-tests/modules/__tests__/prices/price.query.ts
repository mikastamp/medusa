import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { ContainerRegistrationKeys } from "@medusajs/utils"
import { createAdminUser } from "../../../helpers/create-admin-user"
import {
  getPricelistFixture,
  getProductFixture,
} from "../../../helpers/fixtures"

jest.setTimeout(50000)

const env = { MEDUSA_FF_MEDUSA_V2: true }
const adminHeaders = {
  headers: { "x-medusa-access-token": "test_token" },
}

medusaIntegrationTestRunner({
  env,
  testSuite: ({ dbConnection, getContainer, api }) => {
    describe("Query - Price", () => {
      let appContainer, query

      beforeAll(async () => {
        appContainer = getContainer()
      })

      beforeEach(async () => {
        await createAdminUser(dbConnection, adminHeaders, appContainer)
      })

      describe("Query - price", () => {
        let product, priceList

        beforeEach(async () => {
          query = appContainer.resolve(ContainerRegistrationKeys.QUERY)

          product = (
            await api.post(
              "/admin/products",
              getProductFixture({
                title: "Base product",
                variants: [
                  {
                    title: "Test variant",
                    prices: [
                      {
                        currency_code: "usd",
                        amount: 100,
                      },
                      {
                        currency_code: "eur",
                        amount: 45,
                      },
                      {
                        currency_code: "dkk",
                        amount: 30,
                      },
                    ],
                    options: {
                      size: "large",
                      color: "green",
                    },
                  },
                ],
              }),
              adminHeaders
            )
          ).data.product

          priceList = (
            await api.post(
              "/admin/price-lists",
              getPricelistFixture({
                title: "New sale",
                prices: [
                  {
                    amount: 100,
                    currency_code: "usd",
                    variant_id: product.variants[0].id,
                    min_quantity: 1,
                    max_quantity: 100,
                  },
                  {
                    amount: 80,
                    currency_code: "usd",
                    variant_id: product.variants[0].id,
                    min_quantity: 101,
                    max_quantity: 500,
                  },
                ],
              }),
              adminHeaders
            )
          ).data.price_list
        })

        it("should query prices filtered by price list and price set", async () => {
          // User's intellisense guides them to filter like this:

          // const { data } = await query.graph({
          //   entity: "price",
          //   fields: ["*"],
          //   filters: {
          //     price_rules: {
          //       price_list_id: priceList.id,
          //       price_set_id: [],
          //     },
          //   },
          // })

          // Correct way to query price filtered by price list and price set
          const { data } = await query.graph({
            entity: "price",
            fields: ["*"],
            filters: {
              price_list_id: priceList.id,
              price_set_id: [],
            },
          })

          console.log("data -- ", data)
        })
      })
    })
  },
})
