import { outdent } from "outdent"
import { generateRoutes } from "../routes"
import { generateModule } from "../utils"

export async function generateVirtualRouteModule(
  sources: Set<string>,
  isPlugin = false
) {
  const routes = await generateRoutes(sources)

  const imports = [...routes.imports]

  const code = outdent`
    ${imports.join("\n")}

    ${
      isPlugin
        ? `export const routeModules = { ${routes.code} }`
        : `export default { ${routes.code} }`
    }
  `

  return generateModule(code)
}
