import type { EventHandlerRequest, H3Event } from 'h3'
import { access, constants } from 'node:fs/promises'
import { join, resolve, extname } from 'node:path'
import { notesPath } from '~/server/folder'
import type { APIError } from '~/types/result'

type EventHandlerWithNotebookAndNote<T extends EventHandlerRequest, D> = (
  event: H3Event<T>,
  notebooks: string[],
  note: string,
  fullPath: string,
  notebookPath: string,
  isMarkdown: boolean
) => Promise<D>

export function defineEventHandlerWithNotebookAndNote<T extends EventHandlerRequest, D>(
  handler: EventHandlerWithNotebookAndNote<T, D>,
  options?: { noteCheck: boolean }
) {
  return defineEventHandler(async (event) => {
    // Decode the path and then remove characters we cannot have
    const params = decodeURIComponent(event.context.params?.path ?? '')
    const path = params.split('/').map((p) => p.replace(/[\\/:*?"<>|]/g, '')) || []
    const notebooks = path.slice(0, -1)
    const note = path.at(-1)

    if (notebooks.length === 0 || !note) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        message: 'Missing notebook or note name'
      })
    }

    // Construct paths
    const targetFolder = resolve(join(notesPath, ...notebooks))
    const filename = note
    const fullPath = join(targetFolder, filename)

    const fileExtension = extname(fullPath).toLowerCase()
    const isMarkdown = fileExtension === '.md'

    //Is the name going to exceed limits?
    if (note.length > 255) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        message: `Name exceeds maximum allowed length of 255 characters.`
      })
    }

    // Add OS path length validation
    const isWindows = process.platform === 'win32'
    const maxPathLength = isWindows ? 259 : 4095 // Same limits as folder creation

    if (fullPath.length > maxPathLength) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        message: `Path exceeds maximum allowed length of ${maxPathLength} characters.`
      })
    }

    // Security checks
    if (!targetFolder.startsWith(resolve(notesPath))) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        message: 'Invalid notebook path'
      })
    }

    try {
      // Verify notebook and note exist and is read/write allowed
      await access(targetFolder, constants.R_OK | constants.W_OK)
      if (options?.noteCheck) await access(fullPath, constants.R_OK | constants.W_OK)
    } catch (error) {
      console.error('Note error:', error)

      const err = error as NodeJS.ErrnoException
      const message =
        err.code === 'ENOENT'
          ? err.path === targetFolder
            ? `Notebook "${notebooks.join(' > ')}" does not exist`
            : `Note "${note}" does not exist`
          : 'Access error'

      throw createError({
        statusCode: 404,
        statusMessage: 'Not Found',
        message
      })
    }
    try {
      return await handler(event, notebooks, note, fullPath, targetFolder, isMarkdown)
    } catch (error) {
      console.log(event, error)
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw createError({
          statusCode: 404,
          statusMessage: 'Not Found',
          message: 'Note or notebook does not exist'
        })
      } else if (error instanceof URIError) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Bad Request',
          message: 'Invalid URL encoding.'
        })
      } else if (error instanceof Error && 'statusCode' in error) {
        const err = error as APIError
        throw createError({
          statusCode: err.statusCode ?? 500,
          statusMessage: err.statusMessage ?? 'Internal Server Error',
          message: err.message ?? 'An unexpected error occurred'
        })
      } else {
        throw createError({
          statusCode: 500,
          statusMessage: 'Internal Server Error',
          message: 'An unexpected error occurred'
        })
      }
    }
  })
}
