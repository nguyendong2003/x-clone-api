import { Request, Response, NextFunction } from 'express'
import { checkSchema } from 'express-validator'
import { UsersMessages } from '~/constants/messages'
import databaseService from '~/services/database.services'
import usersService from '~/services/users.services'
import { hashPassword } from '~/utils/crypto'
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
