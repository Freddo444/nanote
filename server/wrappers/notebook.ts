import type { EventHandlerRequest, H3Event } from 'h3'
import { access, constants } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import basePath from '~/server/folder'

type EventHandlerWithNotebook<T extends EventHandlerRequest, D> = (
  event: H3Event<T>,
  notebook: string[],
  fullPath: string,
  parentFolder: string,
  name: string | undefined
) => Promise<D>

export function defineEventHandlerWithNotebook<T extends EventHandlerRequest, D>(
  handler: EventHandlerWithNotebook<T, D>,
  options?: { notebookCheck: boolean }
) {
  return defineEventHandler(async (event) => {
    // Decode the path and then remove characters we cannot have
    const params = decodeURIComponent(event.context.params?.path ?? '')
    const notebooks = params
      .split('/')
      .map((p) => p.replace(/[\\/:*?"<>|.]/g, ''))
      .filter(Boolean) // Removes empty strings

    // Construct paths
    const fullPath = join(basePath, ...notebooks)
    const targetFolder = resolve(fullPath)

    // Check OS path length limitations
    const isWindows = process.platform === 'win32'
    const maxPathLength = isWindows ? 259 : 4095 // Windows MAX_PATH (260 incl. null) vs Linux/macOS PATH_MAX (4096)

    if (fullPath.length > maxPathLength) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        message: `Notebook name is too long. The full path exceeds the maximum allowed length of ${maxPathLength} characters.`
      })
    }

    const parentFolderArray = notebooks.slice(0, -1) ?? []
    const parentFolder = join(basePath, ...parentFolderArray)
    const name = notebooks.at(-1)
    // This is for a new notebook, we can bail early
    if (options?.notebookCheck === false) return await handler(event, notebooks, fullPath, parentFolder, name)

    // Security checks
    if (!targetFolder.startsWith(resolve(basePath))) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        message: 'Invalid notebook path'
      })
    }
    try {
      // Check if notebook exists
      await access(targetFolder, constants.R_OK | constants.W_OK) // Make sure its readable and writable
    } catch {
      throw createError({
        statusCode: 404,
        statusMessage: 'Not Found',
        message: `Notebook "${notebooks.join(' > ')}" does not exist`
      })
    }

    return await handler(event, notebooks, fullPath, parentFolder, name)
  })
}
