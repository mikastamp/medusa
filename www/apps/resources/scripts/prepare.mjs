import { generateEditedDates, generateSidebar } from "build-scripts"
import { generateTags } from "tags"
import { main as generateSlugChanges } from "./generate-slug-changes.mjs"
import { main as generateFilesMap } from "./generate-files-map.mjs"
import { sidebar } from "../sidebar.mjs"
import path from "path"

async function main() {
  await generateTags(path.resolve("..", "..", "packages", "tags"))
  await generateSidebar(sidebar)
  await generateSlugChanges()
  await generateFilesMap()
  await generateEditedDates()
}

void main()
