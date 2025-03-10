/** @type {import('types').Sidebar.SidebarItem[]} */
export const pluginsSidebar = [
  {
    type: "sidebar",
    sidebar_id: "plugins",
    title: "Plugins",
    children: [
      {
        type: "link",
        title: "Overview",
        path: "/plugins",
      },
      {
        type: "category",
        title: "Guides",
        children: [
          {
            type: "link",
            title: "Wishlist",
            path: "/plugins/guides/wishlist",
            description: "Learn how to build a wishlist plugin.",
          },
        ],
      },
    ],
  },
]
