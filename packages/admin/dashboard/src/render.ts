import { createRoot } from "react-dom/client"
import { DashboardApp, DashboardPlugin } from "./extensions"

import displayModule from "virtual:medusa/displays"
import formModule from "virtual:medusa/forms"
import menuItemModule from "virtual:medusa/menu-items"
import routeModule from "virtual:medusa/routes"
import widgetModule from "virtual:medusa/widgets"

import "./index.css"

/**
 * Local extensions are extensions that are part of the main application.
 */
const localExtensions = {
  displayModule,
  formModule,
  menuItemModule,
  widgetModule,
  routeModule,
}

export function render(
  mountNode: HTMLElement | null,
  plugins: DashboardPlugin[] = []
) {
  if (!mountNode) {
    throw new Error("Mount node is required")
  }

  const app = new DashboardApp({
    plugins: [localExtensions, ...plugins],
  })

  createRoot(mountNode).render(app.render())

  if (import.meta.hot) {
    import.meta.hot.accept()
  }
}
