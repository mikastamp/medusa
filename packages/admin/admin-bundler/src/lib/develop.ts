import express, { RequestHandler } from "express"
import fs from "fs"
import path from "path"
import type { ViteDevServer } from "vite"

import { BundlerOptions } from "../types"
import { getDevelopmentConfig, mergeConfigWithUserConfig } from "./config"

const router = express.Router()

function findTemplateFilePath(
  reqPath: string,
  root: string
): string | undefined {
  if (reqPath.endsWith(".html")) {
    const pathToTest = path.join(root, reqPath)
    if (fs.existsSync(pathToTest)) {
      return pathToTest
    }
  }

  const basePath = reqPath.slice(0, reqPath.lastIndexOf("/"))
  const dirs = basePath.split("/")

  while (dirs.length > 0) {
    const pathToTest = path.join(root, ...dirs, "index.html")
    if (fs.existsSync(pathToTest)) {
      return pathToTest
    }
    dirs.pop()
  }

  return undefined
}

async function injectViteMiddleware(
  router: express.Router,
  middleware: RequestHandler
) {
  router.use((req, res, next) => {
    req.path.endsWith(".html") ? next() : middleware(req, res, next)
  })
}

async function injectHtmlMiddleware(
  router: express.Router,
  server: ViteDevServer
) {
  router.use(async (req, res, next) => {
    if (req.method !== "GET") {
      return next()
    }

    const templateFilePath = findTemplateFilePath(req.path, server.config.root)
    if (!templateFilePath) {
      return next()
    }

    const template = fs.readFileSync(templateFilePath, "utf8")
    const html = await server.transformIndexHtml(
      templateFilePath,
      template,
      req.originalUrl
    )

    res.send(html)
  })
}

export async function develop(options: BundlerOptions) {
  const { createServer } = await import("vite")

  try {
    const viteConfig = await getDevelopmentConfig(options)
    const finalConfig = await mergeConfigWithUserConfig(viteConfig, options)

    const server = await createServer(finalConfig)

    await injectViteMiddleware(router, server.middlewares)
    await injectHtmlMiddleware(router, server)
  } catch (error) {
    console.error(error)
    throw new Error(
      "Failed to start admin development server. See error above."
    )
  }

  return router
}
