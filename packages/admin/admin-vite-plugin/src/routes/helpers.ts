import { normalizePath, VALID_FILE_EXTENSIONS } from "../utils"

export function getRoute(file: string): string {
  const importPath = normalizePath(file)
  return importPath
    .replace(/.*\/admin\/(routes)/, "")
    .replace(/(?:\[([^\]]+)\]|_([^_]+)_)/g, ":$1$2")
    .replace(
      new RegExp(
        `/page\\.(${VALID_FILE_EXTENSIONS.map((ext) => ext.slice(1)).join(
          "|"
        )})$`
      ),
      ""
    )
}
