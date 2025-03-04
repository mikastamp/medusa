import { createContext } from "react"
import { DashboardApp } from "../dashboard-extension-manager"

type DasboardExtenstionContextValue = DashboardApp["api"]

export const DashboardExtensionContext =
  createContext<DasboardExtenstionContextValue | null>(null)
