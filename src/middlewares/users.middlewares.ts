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
import { config } from 'dotenv'

config()

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
        trim: true,
        custom: {
          options: async (value: string, { req }) => {
            // Extract the access token from the Bearer token
            const access_token = (value || '').split(' ')[1]
            if (!access_token) {
              throw new ErrorWithStatus({
                message: UsersMessages.ACCESS_TOKEN_IS_REQUIRED,
                status: HttpStatus.UNAUTHORIZED
              })
            }

            try {
              const decoded_authorization = await verifyToken({
                token: access_token,
                secretOrPublicKey: process.env.JWT_SECRET_ACCESS_TOKEN as string
              })
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
        trim: true,
        custom: {
          options: async (value: string, { req }) => {
            // If value is missing, throw an ErrorWithStatus so `validate` forwards it directly
            if (!value) {
              throw new ErrorWithStatus({
                message: UsersMessages.REFRESH_TOKEN_IS_REQUIRED,
                status: HttpStatus.UNAUTHORIZED
              })
            }

            try {
              const [decoded_refresh_token, refresh_token] = await Promise.all([
                verifyToken({ token: value, secretOrPublicKey: process.env.JWT_SECRET_REFRESH_TOKEN as string }),
                databaseService.refreshTokens.findOne({ token: value })
              ])

              // If refresh_token doesn't exist on database or was already used
              if (!refresh_token) {
                throw new ErrorWithStatus({
                  message: UsersMessages.REFRESH_TOKEN_IS_USED_OR_NOT_EXIST,
                  status: HttpStatus.UNAUTHORIZED
                })
              }

              ;(req as Request).decoded_refresh_token = decoded_refresh_token
              return true
            } catch (error) {
              // Lỗi từ verifyToken
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

export const emailVerifyTokenValidator = validate(
  checkSchema(
    {
      email_verify_token: {
        trim: true,
        custom: {
          options: async (value: string, { req }) => {
            // If value is missing, throw an ErrorWithStatus so `validate` forwards it directly
            if (!value) {
              throw new ErrorWithStatus({
                message: UsersMessages.EMAIL_VERIFY_TOKEN_IS_REQUIRED,
                status: HttpStatus.UNAUTHORIZED
              })
            }

            try {
              const decoded_email_verify_token = await verifyToken({
                token: value,
                secretOrPublicKey: process.env.JWT_SECRET_EMAIL_VERIFY_TOKEN as string
              })

              ;(req as Request).decoded_email_verify_token = decoded_email_verify_token
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
    ['body']
  )
)
