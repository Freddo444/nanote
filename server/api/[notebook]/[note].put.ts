import { rename, access, constants, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { defineEventHandlerWithNotebookAndNote } from '~/server/wrappers/note'

export default defineEventHandlerWithNotebookAndNote(
  async (event, cleanNotebook, _cleanNote, fullPath, notebookPath) => {
    const body = await readBody(event)

    try {
      // Validate and decode parameters
      if (!body?.newName) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Bad Request',
          message: 'Missing new name.'
        })
      }

      const cleanNewNote = body.newName.replace(/[\\/:*?"<>|]/g, '')

      const newPath = join(notebookPath, `${cleanNewNote}.md`)

      try {
        await access(newPath, constants.F_OK)
        throw createError({
          statusCode: 409,
          statusMessage: 'Conflict',
          message: 'New note name already exists'
        })
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
      }

      // Perform rename
      await rename(fullPath, newPath)
      const stats = await stat(newPath)

      return {
        name: cleanNewNote,
        notebook: cleanNotebook,
        createdAt: stats.birthtime.toISOString(),
        updatedAt: stats.mtime.toISOString()
      }
    } catch (error) {
      if (error instanceof URIError) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Bad Request',
          message: 'Invalid URL encoding.'
        })
      }

      const httpError = error as { statusCode?: number }
      if (httpError.statusCode) throw error

      throw createError({
        statusCode: 500,
        statusMessage: 'Internal Server Error',
        message: 'Failed to rename note.'
      })
    }
  }
)
