import { apiKeySidebar } from "./sidebars/api-key.mjs"
import { architecturalModulesSidebar } from "./sidebars/architectural-modules.mjs"
import { authSidebar } from "./sidebars/auth.mjs"
import { cartSidebar } from "./sidebars/cart.mjs"
import { currencySidebar } from "./sidebars/currency.mjs"
import { customerSidebar } from "./sidebars/customer.mjs"
import { fulfillmentSidebar } from "./sidebars/fulfillment.mjs"
import { integrationsSidebar } from "./sidebars/integrations.mjs"
import { pluginsSidebar } from "./sidebars/plugins.mjs"
import { inventorySidebar } from "./sidebars/inventory.mjs"
import { orderSidebar } from "./sidebars/order-module.mjs"
import { paymentSidebar } from "./sidebars/payment.mjs"
import { pricingSidebar } from "./sidebars/pricing.mjs"
import { productSidebar } from "./sidebars/product.mjs"
import { promotionSidebar } from "./sidebars/promotion.mjs"
import { recipesSidebar } from "./sidebars/recipes.mjs"
import { referencesSidebar } from "./sidebars/references.mjs"
import { regionSidebar } from "./sidebars/region.mjs"
import { salesChannelSidebar } from "./sidebars/sales-channel.mjs"
import { sdkToolsSidebar } from "./sidebars/sdk-tools.mjs"
import { stockLocationSidebar } from "./sidebars/stock-location.mjs"
import { storeSidebar } from "./sidebars/store.mjs"
import { storefrontGuidesSidebar } from "./sidebars/storefront.mjs"
import { taxSidebar } from "./sidebars/tax.mjs"
import { troubleshootingSidebar } from "./sidebars/troubleshooting.mjs"
import { userSidebar } from "./sidebars/user.mjs"
import { examplesSidebar } from "./sidebars/examples.mjs"

/** @type {import("types").Sidebar.RawSidebar[]} */
export const sidebar = [
  {
    sidebar_id: "resources",
    title: "Development Resources",
    items: [
      {
        type: "link",
        path: "/",
        title: "Overview",
      },
      ...examplesSidebar,
      ...recipesSidebar,
      {
        type: "separator",
      },
      {
        type: "link",
        path: "/commerce-modules",
        title: "Commerce Modules",
        hideChildren: true,
        sort_sidebar: "alphabetize",
        children: [
          ...apiKeySidebar,
          ...authSidebar,
          ...cartSidebar,
          ...currencySidebar,
          ...customerSidebar,
          ...fulfillmentSidebar,
          ...inventorySidebar,
          ...orderSidebar,
          ...paymentSidebar,
          ...pricingSidebar,
          ...productSidebar,
          ...promotionSidebar,
          ...regionSidebar,
          ...salesChannelSidebar,
          ...stockLocationSidebar,
          ...storeSidebar,
          ...taxSidebar,
          ...userSidebar,
        ],
      },
      ...architecturalModulesSidebar,
      ...integrationsSidebar,
      ...pluginsSidebar,
      ...storefrontGuidesSidebar,
      {
        type: "separator",
      },
      {
        type: "category",
        title: "SDKs and Tools",
        children: sdkToolsSidebar,
      },
      {
        type: "category",
        title: "General",
        children: [
          {
            type: "sidebar",
            sidebar_id: "deployment-guides",
            title: "Deployment Guides",
            children: [
              {
                type: "link",
                path: "/deployment",
                title: "Overview",
              },
              {
                type: "separator",
              },
              {
                type: "link",
                title: "Medusa Cloud",
                path: "https://medusajs.com/pricing",
              },
              {
                type: "separator",
              },
              {
                type: "category",
                title: "Self-Hosting",
                children: [
                  {
                    type: "link",
                    path: "https://docs.medusajs.com/learn/deployment/general",
                    title: "General",
                  },
                  {
                    type: "link",
                    path: "/deployment/medusa-application/railway",
                    title: "Railway",
                  },
                ],
              },
              {
                type: "category",
                title: "Next.js Starter",
                autogenerate_path: "/deployment/storefront",
              },
            ],
          },
          ...troubleshootingSidebar,
        ],
      },
      {
        type: "category",
        title: "Admin",
        children: [
          {
            type: "link",
            path: "/admin-widget-injection-zones",
            title: "Admin Widget Injection Zones",
          },
          {
            type: "sidebar",
            sidebar_id: "admin-components",
            title: "Admin Components",
            children: [
              {
                type: "link",
                path: "/admin-components",
                title: "Overview",
              },
              {
                type: "separator",
              },
              {
                type: "category",
                title: "Layouts",
                autogenerate_path: "/admin-components/layouts",
              },
              {
                type: "category",
                title: "Components",
                autogenerate_path: "/admin-components/components",
              },
            ],
          },
        ],
      },
      {
        type: "category",
        title: "Lists",
        children: [
          {
            type: "link",
            path: "/medusa-container-resources",
            title: "Container Dependencies",
          },
          {
            type: "link",
            path: "/events-reference",
            title: "Events List",
          },
        ],
      },
      {
        type: "category",
        title: "References",
        children: referencesSidebar,
      },
    ],
  },
]
