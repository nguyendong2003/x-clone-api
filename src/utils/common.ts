import { Request } from 'express'
import { JsonWebTokenError } from 'jsonwebtoken'
import { capitalize } from 'lodash'
import { EnvConfig } from '~/config/config'
import { HttpStatus } from '~/constants/httpStatus'
import { UsersMessages } from '~/constants/messages'
import { ErrorWithStatus } from '~/models/Errors'
import { verifyToken } from '~/utils/jwt'
/**
 * Hàm chuyển enum thành mảng number
 */
export const numberEnumToArray = (numberEnum: { [key: string]: string | number }) => {
  return Object.values(numberEnum).filter((value) => typeof value === 'number') as number[]
}

export const verifyAccessToken = async (access_token: string, req?: Request) => {
  if (!access_token) {
    throw new ErrorWithStatus({
      message: UsersMessages.ACCESS_TOKEN_IS_REQUIRED,
      status: HttpStatus.UNAUTHORIZED
    })
  }
  try {
    const decoded_authorization = await verifyToken({
      token: access_token,
      secretOrPublicKey: EnvConfig.JWT_SECRET_ACCESS_TOKEN as string
    })
    if (req) {
      ;(req as Request).decoded_authorization = decoded_authorization
      return true
    }
    return decoded_authorization
  } catch (error) {
    throw new ErrorWithStatus({
      message: capitalize((error as JsonWebTokenError).message),
      status: HttpStatus.UNAUTHORIZED
    })
  }
}
