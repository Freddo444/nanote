import { mkdir, access, constants } from 'node:fs/promises'
import type { Notebook } from '~/types/notebook'
import { defineEventHandlerWithNotebook } from '~/server/wrappers/notebook'

export default defineEventHandlerWithNotebook(
  async (event, cleanNotebook, fullPath) => {
    try {
      // Check if folder already exists and read/write-able
      await access(fullPath, constants.R_OK | constants.W_OK)
      throw createError({
        statusCode: 409,
        statusMessage: 'Conflict',
        message: 'Notebook already exists'
      })
    } catch (error) {
      // Only proceed if error is "not found"
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error
      }
    }

    try {
      // Create the directory
      await mkdir(fullPath)

      // Return the new notebook structure matching your type
      return {
        name: cleanNotebook,
        createdAt: new Date().toISOString(),
        updatedAt: null,
        fileCount: 0
      } satisfies Notebook
    } catch (error) {
      console.error('Error creating notebook:', error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Internal Server Error',
        message: 'Failed to create notebook'
      })
    }
  },
  { notebookCheck: false }
)
