import { rename, access, constants, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { defineEventHandlerWithNotebookAndNote } from '~/server/wrappers/note'
import type { RenameNote } from '~/types/notebook'
// import { waitforme } from '~/server/utils'

/**
 * Renaming note
 */
export default defineEventHandlerWithNotebookAndNote(
  async (event, notebook, note, fullPath, notebookPath): Promise<RenameNote> => {
    const body = await readBody(event)

    // Validate and decode parameters
    if (!body?.newName) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        message: 'Missing new name.'
      })
    }

    const cleanNewNote = body.newName.replace(/[\\/:*?"<>|]/g, '')

    const newPath = join(notebookPath, cleanNewNote)

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
      oldName: note,
      newName: cleanNewNote,
      notebook: notebook,
      createdAt: stats.birthtime.toISOString(),
      updatedAt: stats.mtime.toISOString()
    } satisfies RenameNote
  }
)
