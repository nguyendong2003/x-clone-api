import { Request, Response, NextFunction } from 'express'
import { checkSchema, ParamSchema } from 'express-validator'
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
import { ObjectId } from 'mongodb'
import { TokenPayload } from '~/models/requests/User.requests'
import { UserVerifyStatus } from '~/constants/enums'

config()

const passwordSchema: ParamSchema = {
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

const confirmPasswordSchema: ParamSchema = {
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
}

const nameSchema: ParamSchema = {
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
}

const dateOfBirthSchema: ParamSchema = {
  isISO8601: {
    options: {
      strict: true,
      strictSeparator: true
    }
  },
  errorMessage: UsersMessages.DATE_OF_BIRTH_INVALID
}

const forgotPasswordTokenSchema: ParamSchema = {
  trim: true,
  custom: {
    options: async (value: string, { req }) => {
      // If value is missing, throw an ErrorWithStatus so `validate` forwards it directly
      if (!value) {
        throw new ErrorWithStatus({
          message: UsersMessages.FORGOT_PASSWORD_TOKEN_IS_REQUIRED,
          status: HttpStatus.UNAUTHORIZED
        })
      }

      try {
        const decoded_forgot_password_token = await verifyToken({
          token: value,
          secretOrPublicKey: process.env.JWT_SECRET_FORGOT_PASSWORD_TOKEN as string
        })

        const { user_id } = decoded_forgot_password_token
        const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) })

        if (!user) {
          throw new ErrorWithStatus({
            message: UsersMessages.USER_NOT_FOUND,
            status: HttpStatus.UNAUTHORIZED
          })
        }

        if (user.forgot_password_token !== value) {
          throw new ErrorWithStatus({
            message: UsersMessages.FORGOT_PASSWORD_TOKEN_INVALID,
            status: HttpStatus.UNAUTHORIZED
          })
        }

        ;(req as Request).decoded_forgot_password_token = decoded_forgot_password_token
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

      return true
    }
  }
}

const imageSchema: ParamSchema = {
  optional: true,
  isString: {
    errorMessage: UsersMessages.IMAGE_URL_MUST_BE_STRING
  },
  trim: true,
  isLength: {
    options: {
      min: 1,
      max: 500
    },
    errorMessage: UsersMessages.IMAGE_URL_LENGTH_INVALID
  }
}

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
      }
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
    name: nameSchema,
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
      }
    },
    password: passwordSchema,
    confirm_password: confirmPasswordSchema,
    date_of_birth: dateOfBirthSchema
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

            return true
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

export const forgotPasswordValidator = validate(
  checkSchema({
    email: {
      isEmail: {
        errorMessage: UsersMessages.EMAIL_INVALID
      },
      trim: true,
      custom: {
        options: async (value, { req }) => {
          const user = await databaseService.users.findOne({ email: value })
          if (!user) {
            throw new Error(UsersMessages.USER_NOT_FOUND)
          }
          req.user = user
          return true
        }
      }
    }
  })
)

export const verifyForgotPasswordTokenValidator = validate(
  checkSchema(
    {
      forgot_password_token: forgotPasswordTokenSchema
    },
    ['body']
  )
)

export const resetPasswordValidator = validate(
  checkSchema({
    forgot_password_token: forgotPasswordTokenSchema,
    password: passwordSchema,
    confirm_password: confirmPasswordSchema
  })
)

// Middleware to check if the user is verified
export const verifiedUserValidator = (req: Request, res: Response, next: NextFunction) => {
  const { verify } = req.decoded_authorization as TokenPayload
  if (verify !== UserVerifyStatus.Verified) {
    // dùng next(error) hoặc throw error đều được
    return next(
      new ErrorWithStatus({
        message: UsersMessages.USER_NOT_VERIFIED,
        status: HttpStatus.FORBIDDEN
      })
    )
  }

  // User is verified, continue to the next middleware/controller
  next()
}

export const updatedMeValidator = validate(
  checkSchema(
    {
      name: {
        ...nameSchema,
        optional: true,
        notEmpty: undefined
      },
      date_of_birth: {
        ...dateOfBirthSchema,
        optional: true
      },
      bio: {
        optional: true,
        isString: {
          errorMessage: UsersMessages.BIO_MUST_BE_STRING
        },
        trim: true, // trim phải đặt dưới optional thì mới check được
        isLength: {
          options: {
            min: 1,
            max: 200
          },
          errorMessage: UsersMessages.BIO_LENGTH_INVALID
        }
      },
      location: {
        optional: true,
        isString: {
          errorMessage: UsersMessages.LOCATION_MUST_BE_STRING
        },
        trim: true,
        isLength: {
          options: {
            min: 1,
            max: 100
          },
          errorMessage: UsersMessages.LOCATION_LENGTH_INVALID
        }
      },
      website: {
        optional: true,
        isString: {
          errorMessage: UsersMessages.WEBSITE_MUST_BE_STRING
        },
        trim: true,
        isLength: {
          options: {
            min: 1,
            max: 200
          },
          errorMessage: UsersMessages.WEBSITE_LENGTH_INVALID
        }
      },
      username: {
        optional: true,
        isString: {
          errorMessage: UsersMessages.USERNAME_MUST_BE_STRING
        },
        trim: true,
        isLength: {
          options: {
            min: 1,
            max: 50
          },
          errorMessage: UsersMessages.USERNAME_LENGTH_INVALID
        }
      },
      avatar: imageSchema,
      cover_photo: imageSchema
    },
    ['body']
  )
)

export const followValidator = validate(
  checkSchema(
    {
      followed_user_id: {
        custom: {
          options: async (value: string, { req }) => {
            if (!ObjectId.isValid(value)) {
              throw new ErrorWithStatus({
                message: UsersMessages.FOLLOWED_USER_ID_INVALID,
                status: HttpStatus.BAD_REQUEST
              })
            }

            const followedUser = await databaseService.users.findOne({ _id: new ObjectId(value) })
            if (!followedUser) {
              throw new ErrorWithStatus({
                message: UsersMessages.USER_NOT_FOUND,
                status: HttpStatus.NOT_FOUND
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
