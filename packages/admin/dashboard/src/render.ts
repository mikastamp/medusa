import { createRoot } from "react-dom/client"
import { AdminPlugin, Application } from "./application"

const renderAdmin = async (
  mountNode: HTMLElement | null,
  plugins: AdminPlugin[]
) => {
  if (!mountNode) {
    throw new Error("Mount node not found")
  }

  const newApplication = new Application()

  createRoot(mountNode).render(newApplication.render())

  if (typeof import.meta.hot?.accept === "function") {
    import.meta.hot.accept()
  }
}
