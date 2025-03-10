/** @type {import('types').Sidebar.SidebarItem[]} */
export const sdkToolsSidebar = [
  {
    type: "link",
    path: "/create-medusa-app",
    title: "create-medusa-app",
  },
  {
    type: "sidebar",
    sidebar_id: "medusa-cli",
    title: "Medusa CLI",
    childSidebarTitle: "Medusa CLI Reference",
    children: [
      {
        type: "link",
        path: "/medusa-cli",
        title: "Overview",
      },
      {
        type: "separator",
      },
      {
        type: "category",
        title: "Commands",
        autogenerate_path: "medusa-cli/commands",
      },
    ],
  },
  {
    type: "sidebar",
    sidebar_id: "js-sdk",
    title: "JS SDK",
    childSidebarTitle: "JS SDK Reference",
    children: [
      {
        type: "link",
        path: "/js-sdk",
        title: "Overview",
      },
      {
        type: "separator",
      },
      {
        type: "category",
        title: "Auth",
        autogenerate_path: "/references/js_sdk/auth/Auth/methods",
        initialOpen: true,
      },
      {
        type: "category",
        title: "Store",
        autogenerate_path: "/references/js_sdk/store/Store/properties",
        initialOpen: true,
      },
      {
        type: "category",
        title: "Admin",
        autogenerate_path: "/references/js_sdk/admin/Admin/properties",
        initialOpen: true,
      },
    ],
  },
  {
    type: "sidebar",
    sidebar_id: "nextjs-starter",
    title: "Next.js Starter Storefront",
    children: [
      {
        type: "link",
        path: "/nextjs-starter",
        title: "Overview",
      },
      {
        type: "category",
        title: "Payment",
        children: [
          {
            type: "link",
            path: "/nextjs-starter/guides/customize-stripe",
            title: "Customize Stripe Integration",
          },
        ],
      },
    ],
  },
]
