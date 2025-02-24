import type { Plugin } from "vite"

export const createEntryPlugin = (): Plugin => {
  return {
    name: "medusa:create-entry",
  }
}
