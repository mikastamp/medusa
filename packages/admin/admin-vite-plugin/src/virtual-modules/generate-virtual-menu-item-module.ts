import outdent from "outdent"

import { generateMenuItems } from "../routes"
import { generateModule } from "../utils"

export async function generateVirtualMenuItemModule(
  sources: Set<string>,
  isPlugin = false
) {
  const menuItems = await generateMenuItems(sources)

  const code = outdent`
          ${menuItems.imports.join("\n")}

    ${
      isPlugin
        ? `const menuItemModules = { ${menuItems.code} }`
        : `export default { ${menuItems.code} }`
    }
  `

  return generateModule(code)
}
