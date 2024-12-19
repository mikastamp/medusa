import { statSync } from "fs"
import { mkdir, readdir, rm, writeFile } from "fs/promises"
import path from "path"
import type { Tags } from "types"
import { findPageTitle, getFrontMatterSync } from "docs-utils"

type ConfigItem = {
  path: string
  contentPaths: string[]
}

const config: ConfigItem[] = [
  {
    path: path.resolve("..", "..", "apps", "book"),
    contentPaths: ["app"],
  },
  {
    path: path.resolve("..", "..", "apps", "resources"),
    contentPaths: ["app", "references"],
  },
  {
    path: path.resolve("..", "..", "apps", "ui"),
    contentPaths: [path.join("src", "content", "docs")],
  },
  {
    path: path.resolve("..", "..", "apps", "user-guide"),
    contentPaths: ["app"],
  },
]

function normalizePageTitle(title: string): string {
  // remove variables from title
  return title.replaceAll(/\$\{.+\}/g, "").trim()
}

function tagNameToFileName(tagName: string): string {
  return `${tagName.toLowerCase().replaceAll(" ", "-")}.ts`
}

function tagNameToVarName(tagName: string): string {
  return tagName
    .toLowerCase()
    .replaceAll(/\s([a-zA-Z\d])/g, (captured) => captured.toUpperCase().trim())
}

export async function generateTags(basePath?: string) {
  basePath = basePath || path.resolve()
  const tags: Tags = {}
  async function getTags(item: ConfigItem) {
    async function scanDirectory(dirPath: string) {
      const files = await readdir(dirPath)

      for (const file of files) {
        const fullPath = path.join(dirPath, file)
        if (!file.endsWith(".mdx") || file.startsWith("_")) {
          if (statSync(fullPath).isDirectory()) {
            await scanDirectory(fullPath)
          }
          continue
        }

        const frontmatter = getFrontMatterSync(fullPath)
        const fileBasename = path.basename(file)

        frontmatter.tags?.forEach((tag) => {
          if (!Object.hasOwn(tags, tag)) {
            tags[tag] = []
          }

          tags[tag].push({
            title: normalizePageTitle(
              frontmatter.sidebar_label || findPageTitle(fullPath) || ""
            ),
            path:
              frontmatter.slug ||
              fullPath.replace(item.path, "").replace(`/${fileBasename}`, ""),
          })
        })
      }
    }

    for (const contentPath of item.contentPaths) {
      const basePath = path.join(item.path, contentPath)

      await scanDirectory(basePath)
    }
  }

  await Promise.all(
    config.map(async (item) => {
      await getTags(item)
    })
  )

  const tagsDir = path.join(basePath, "src", "tags")
  // clear existing tags
  await rm(tagsDir, {
    recursive: true,
    force: true,
  })
  await mkdir(tagsDir)
  // write tags
  const files: string[] = []
  await Promise.all(
    Object.keys(tags).map(async (tagName) => {
      const fileName = tagNameToFileName(tagName)
      const varName = tagNameToVarName(tagName)

      const content = `export const ${varName} = ${JSON.stringify(tags[tagName], null, 2)}`

      await writeFile(path.join(tagsDir, fileName), content)
      files.push(fileName.replace(/\.ts$/, ".js"))
    })
  )

  // write index.ts
  const indexContent = files.map((file) => `export * from "./${file}"\n`)
  await writeFile(path.join(tagsDir, "index.ts"), indexContent)
}
