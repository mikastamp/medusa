/** @type {import('types').Sidebar.SidebarItem[]} */
export const referencesSidebar = [
  {
    type: "sidebar",
    sidebar_id: "workflows-sdk-reference",
    title: "Workflows SDK",
    childSidebarTitle: "Workflows SDK Reference",
    children: [
      {
        type: "link",
        path: "/references/workflows",
        title: "Reference Overview",
      },
      {
        type: "separator",
      },
      {
        type: "category",
        title: "Functions",
        autogenerate_path: "/references/workflows/functions",
      },
    ],
  },
  {
    type: "sidebar",
    sidebar_id: "dml-reference",
    title: "Data Model Language",
    childSidebarTitle: "Data Model Language Reference",
    children: [
      {
        type: "link",
        path: "/references/data-model",
        title: "Reference Overview",
      },
      {
        type: "separator",
      },
      {
        type: "link",
        path: "/references/data-model/define",
        title: "Define Method",
      },
      {
        type: "separator",
      },
      {
        type: "category",
        title: "Property Types",
        autogenerate_path: "/references/dml/Property_Types/methods",
      },
      {
        type: "category",
        title: "Relationship Methods",
        autogenerate_path: "/references/dml/Relationship_Methods/methods",
      },
      {
        type: "category",
        title: "Model Methods",
        autogenerate_path: "/references/dml/Model_Methods/methods",
      },
      {
        type: "category",
        title: "Property Configuration Methods",
        autogenerate_path:
          "/references/dml/Property_Configuration_Methods/methods",
      },
    ],
  },
  {
    type: "sidebar",
    sidebar_id: "service-factory-reference",
    title: "Service Factory",
    children: [
      {
        type: "link",
        path: "/service-factory-reference",
        title: "Reference Overview",
      },
      {
        type: "separator",
      },
      {
        type: "category",
        title: "Methods",
        autogenerate_path: "/service-factory-reference/methods",
      },
      {
        type: "category",
        title: "Tips",
        autogenerate_path: "/service-factory-reference/tips",
      },
    ],
  },
  {
    type: "sidebar",
    sidebar_id: "helper-steps-reference",
    title: "Helper Steps",
    children: [
      {
        type: "link",
        path: "/references/helper-steps",
        title: "Reference Overview",
      },
      {
        type: "separator",
      },
      {
        type: "category",
        title: "Steps",
        autogenerate_path: "/references/helper_steps/functions",
      },
    ],
  },
  {
    type: "sidebar",
    sidebar_id: "core-flows",
    title: "Core Workflows",
    custom_autogenerate: "core-flows",
  },
  {
    type: "sidebar",
    sidebar_id: "test-tools-reference",
    title: "Testing Framework",
    children: [
      {
        type: "link",
        path: "/test-tools-reference",
        title: "Reference Overview",
      },
      {
        type: "separator",
      },
      {
        type: "category",
        title: "Functions",
        children: [
          {
            type: "link",
            title: "medusaIntegrationTestRunner",
            path: "/test-tools-reference/medusaIntegrationTestRunner",
          },
          {
            type: "link",
            title: "moduleIntegrationTestRunner",
            path: "/test-tools-reference/moduleIntegrationTestRunner",
          },
        ],
      },
    ],
  },
]
