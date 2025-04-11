import { access, constants } from 'node:fs/promises'

export function waitforme(millisec: number) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve('')
    }, millisec)
  })
}

export const checkIfPathExists = async (fullPath: string): Promise<boolean> => {
  try {
    await access(fullPath, constants.F_OK)
    return true
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return false // Folder does not exist
    }
    throw error // Some other error occurred
  }
}
