/** @type {import('types').Sidebar.SidebarItem[]} */
export const examplesSidebar = [
  {
    type: "sidebar",
    sidebar_id: "examples",
    title: "Examples",
    children: [
      {
        type: "link",
        path: "/examples",
        title: "Example Snippets",
      },
      {
        type: "ref",
        path: "/recipes",
        title: "Recipes",
      },
      {
        type: "ref",
        path: "/plugins",
        title: "Plugins",
      },
      {
        type: "ref",
        path: "/integrations",
        title: "Integrations",
      },
      {
        type: "category",
        title: "Server Examples",
        autogenerate_tags: "example+server",
        autogenerate_as_ref: true,
        sort_sidebar: "alphabetize",
      },
      {
        type: "category",
        title: "Admin Examples",
        autogenerate_tags: "example+admin",
        autogenerate_as_ref: true,
        sort_sidebar: "alphabetize",
        children: [],
      },
      {
        type: "category",
        title: "Storefront Examples",
        autogenerate_tags: "example+storefront",
        autogenerate_as_ref: true,
        sort_sidebar: "alphabetize",
        children: [],
      },
    ],
  },
]
