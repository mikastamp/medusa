import type { Plugin } from "vite"
import { writeStaticFiles as writeStaticFilesUtils } from "../utils/write-static-files"

export const writeStaticFiles = (): Plugin => {
  return {
    name: "medusa:write-static-files",
    buildStart: async () => {
      await writeStaticFilesUtils()
    },
  }
}
