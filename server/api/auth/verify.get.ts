import jwt from 'jsonwebtoken'
import SECRET_KEY from '~/server/key'
import type { Result } from '~/types/result'

export default defineEventHandler(async (event) => {
  const cookie = getCookie(event, 'token')

  if (!cookie) {
    return {
      success: false,
      message: 'Not cookie.'
    } satisfies Result<boolean>
  }

  try {
    jwt.verify(cookie, SECRET_KEY)
    return {
      success: true,
      data: true
    } satisfies Result<boolean>
  } catch (err) {
    console.log(err)
    return {
      success: false,
      message: 'Verification failed.'
    } satisfies Result<boolean>
  }
})
