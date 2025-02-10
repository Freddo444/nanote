export type Notebook = {
  name: string
  createdAt: string
  updatedAt: string | null
  fileCount: number
}

export type Note = {
  name: string
  createdAt: string
  updatedAt: string | null
  notebook: string
  size?: number
}

export type NoteResponse = {
  notebook: string
  note: string
  path: string
  createdAt: string
  updatedAt: string
  size: number
  originalFilename: string
}

export type RenameNotebook = {
  oldName: string
  newName: string
  createdAt: string
  updatedAt: string
}

export type RenameNote = {
  oldName: string
  newName: string
  notebook: string
  createdAt: string
  updatedAt: string
}

export type DeleteNote = {
  name: string
  timestamp: string
  notebook: string
  deleted: boolean
}

export type SavingState = 'pending' | 'saving' | 'success' | 'error'

export type SearchResult = {
  notebook: string
  note: string | null
  matchType: 'folder' | 'note' | 'content'
  snippet: string
  score: number
}
