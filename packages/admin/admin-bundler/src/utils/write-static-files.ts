import { mkdir, writeFile } from "node:fs/promises"
import { join } from "node:path"
import outdent from "outdent"

export async function writeStaticFiles(plugins?: string[]) {
  const outDir = join(process.cwd(), ".medusa/client")

  await mkdir(outDir, { recursive: true })

  const promises = [
    writeCSSFile(outDir),
    writeEntryFile(outDir, plugins),
    writeHTMLFile(outDir),
  ]

  await Promise.all(promises)
}

async function writeCSSFile(outDir: string) {
  const css = outdent`
    @import "@medusajs/dashboard/css";

    @tailwind base;
    @tailwind components;
    @tailwind utilities;
  `

  await writeFile(join(outDir, "index.css"), css)
}

async function writeEntryFile(outDir: string, plugins?: string[]) {
  const entry = outdent`
    import { render } from "@medusajs/dashboard";
    import React from "react";
    import ReactDOM from "react-dom/client";
    import "./index.css";

    ${plugins
      ?.map((plugin, idx) => `import plugin${idx} from "${plugin}"`)
      .join("\n")}

    render(document.getElementById("medusa"), [
      ${plugins?.map((plugin, idx) => `plugin${idx}`).join(", ")}
    ])
  `

  await writeFile(join(outDir, "entry.jsx"), entry)
}

async function writeHTMLFile(outDir: string) {
  const html = outdent`
    <!DOCTYPE html>
    <html>
        <head>
            <meta
                http-equiv="Content-Type"
                content="text/html; charset=UTF-8"
            />
            <meta
                name="viewport"
                content="width=device-width, initial-scale=1, user-scalable=no"
            />
            <link rel="icon" href="data:," data-placeholder-favicon />
        </head>

        <body>
            <div id="medusa"></div>
            <script type="module" src="./entry.jsx"></script>
        </body>
    </html>
  `

  await writeFile(join(outDir, "index.html"), html)
}
