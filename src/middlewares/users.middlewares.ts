import { Request, Response, NextFunction } from 'express'
import { checkSchema } from 'express-validator'
import { JsonWebTokenError } from 'jsonwebtoken'
import { capitalize } from 'lodash'
import { HttpStatus } from '~/constants/httpStatus'
import { UsersMessages } from '~/constants/messages'
import { ErrorWithStatus } from '~/models/Errors'
import databaseService from '~/services/database.services'
import usersService from '~/services/users.services'
import { hashPassword } from '~/utils/crypto'
import { verifyToken } from '~/utils/jwt'
import { validate } from '~/utils/validation'

export const loginValidator = validate(
  checkSchema({
    email: {
      isEmail: {
        errorMessage: UsersMessages.EMAIL_INVALID
      },
      trim: true,
      custom: {
        options: async (value, { req }) => {
          const user = await databaseService.users.findOne({ email: value, password: hashPassword(req.body.password) })
          if (!user) {
            throw new Error(UsersMessages.EMAIL_OR_PASSWORD_INCORRECT)
          }
          req.user = user
          return true
        }
      },
      errorMessage: UsersMessages.EMAIL_ALREADY_EXISTS
    },
    password: {
      notEmpty: {
        errorMessage: UsersMessages.PASSWORD_IS_REQUIRED
      },
      isString: {
        errorMessage: UsersMessages.PASSWORD_MUST_BE_STRING
      },
      trim: true,
      isLength: {
        options: {
          min: 6,
          max: 50
        },
        errorMessage: UsersMessages.PASSWORD_LENGTH_INVALID
      },
      isStrongPassword: {
        options: {
          minLength: 6,
          minLowercase: 1,
          minUppercase: 1,
          minNumbers: 1,
          minSymbols: 1
        },
        errorMessage: UsersMessages.PASSWORD_NOT_STRONG_ENOUGH
      }
    }
  })
)

export const registerValidator = validate(
  checkSchema({
    name: {
      notEmpty: {
        errorMessage: UsersMessages.NAME_IS_REQUIRED
      },
      isString: {
        errorMessage: UsersMessages.NAME_MUST_BE_STRING
      },
      trim: true,
      isLength: {
        options: {
          min: 1,
          max: 100
        },
        errorMessage: UsersMessages.NAME_LENGTH_INVALID
      }
    },
    email: {
      notEmpty: {
        errorMessage: UsersMessages.EMAIL_IS_REQUIRED
      },
      isEmail: {
        errorMessage: UsersMessages.EMAIL_INVALID
      },
      trim: true,
      custom: {
        options: async (value) => {
          const isExistEmail = await usersService.checkEmailExist(value)
          if (isExistEmail) {
            throw new Error(UsersMessages.EMAIL_ALREADY_EXISTS)
          }
          return true
        }
      },
      errorMessage: UsersMessages.EMAIL_ALREADY_EXISTS
    },
    password: {
      notEmpty: {
        errorMessage: UsersMessages.PASSWORD_IS_REQUIRED
      },
      isString: {
        errorMessage: UsersMessages.PASSWORD_MUST_BE_STRING
      },
      trim: true,
      isLength: {
        options: {
          min: 6,
          max: 50
        },
        errorMessage: UsersMessages.PASSWORD_LENGTH_INVALID
      },
      isStrongPassword: {
        options: {
          minLength: 6,
          minLowercase: 1,
          minUppercase: 1,
          minNumbers: 1,
          minSymbols: 1
        },
        errorMessage: UsersMessages.PASSWORD_NOT_STRONG_ENOUGH
      }
    },
    confirm_password: {
      notEmpty: {
        errorMessage: UsersMessages.CONFIRM_PASSWORD_IS_REQUIRED
      },
      isString: {
        errorMessage: UsersMessages.CONFIRM_PASSWORD_MUST_BE_STRING
      },
      trim: true,
      isLength: {
        options: {
          min: 6,
          max: 50
        },
        errorMessage: UsersMessages.CONFIRM_PASSWORD_LENGTH_INVALID
      },
      isStrongPassword: {
        options: {
          minLength: 6,
          minLowercase: 1,
          minUppercase: 1,
          minNumbers: 1,
          minSymbols: 1
        },
        errorMessage: UsersMessages.CONFIRM_PASSWORD_NOT_STRONG_ENOUGH
      },
      custom: {
        options: (value, { req }) => value === req.body.password,
        errorMessage: UsersMessages.CONFIRM_PASSWORD_NOT_MATCH
      }
    },
    date_of_birth: {
      notEmpty: true,
      isISO8601: {
        options: {
          strict: true,
          strictSeparator: true
        }
      },
      errorMessage: UsersMessages.DATE_OF_BIRTH_INVALID
    }
  })
)

export const accessTokenValidator = validate(
  checkSchema(
    {
      Authorization: {
        notEmpty: {
          errorMessage: UsersMessages.ACCESS_TOKEN_IS_REQUIRED
        },
        custom: {
          options: async (value: string, { req }) => {
            const access_token = value.split(' ')[1]
            if (!access_token) {
              throw new ErrorWithStatus({
                message: UsersMessages.ACCESS_TOKEN_IS_REQUIRED,
                status: HttpStatus.UNAUTHORIZED
              })
            }

            try {
              const decoded_authorization = await verifyToken({ token: access_token })
              ;(req as Request).decoded_authorization = decoded_authorization
            } catch (error) {
              // Xử lý lỗi từ verifyToken
              throw new ErrorWithStatus({
                message: capitalize((error as JsonWebTokenError).message),
                status: HttpStatus.UNAUTHORIZED
              })
            }
            return true
          }
        }
      }
    },
    ['headers']
  )
)

export const refreshTokenValidator = validate(
  checkSchema(
    {
      refresh_token: {
        notEmpty: {
          errorMessage: UsersMessages.REFRESH_TOKEN_IS_REQUIRED
        },
        custom: {
          options: async (value: string, { req }) => {
            try {
              const [decoded_refresh_token, refresh_token] = await Promise.all([
                verifyToken({ token: value }),
                databaseService.refreshTokens.findOne({ token: value })
              ])

              // Nếu refresh_token không tồn tại trong database hoặc đã bị sử dụng
              if (!refresh_token) {
                throw new ErrorWithStatus({
                  message: UsersMessages.REFRESH_TOKEN_IS_USED_OR_NOT_EXIST,
                  status: HttpStatus.UNAUTHORIZED
                })
              }

              ;(req as Request).decoded_refresh_token = decoded_refresh_token
              return true
            } catch (error) {
              // Xử lý lỗi từ verifyToken
              if (error instanceof JsonWebTokenError) {
                throw new ErrorWithStatus({
                  message: capitalize((error as JsonWebTokenError).message),
                  status: HttpStatus.UNAUTHORIZED
                })
              }

              // Lỗi khác
              throw error
            }
          }
        }
      }
    },
    ['body']
  )
)
