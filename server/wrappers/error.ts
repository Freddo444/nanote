import type { EventHandlerRequest, H3Event } from 'h3'
import type { APIError } from '~/types/result'

type EventHandlerWithError<T extends EventHandlerRequest, D> = (event: H3Event<T>) => Promise<D>

export function defineEventHandlerWithError<T extends EventHandlerRequest, D>(handler: EventHandlerWithError<T, D>) {
  return defineEventHandler(async (event) => {
    try {
      return await handler(event)
    } catch (error) {
      console.log(event, error)
      if (error instanceof URIError) {
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
      } else if (error instanceof Error && (error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw createError({
          statusCode: 404,
          statusMessage: 'Not Found',
          message: 'The requested file does not exist.'
        })
      } else if (error instanceof Error && (error as NodeJS.ErrnoException).code === 'EACCES') {
        throw createError({
          statusCode: 403,
          statusMessage: 'Forbidden',
          message: 'Permission denied: Cannot access the requested file.'
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
