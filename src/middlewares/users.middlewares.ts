import { Request, Response, NextFunction } from 'express'
import { checkSchema } from 'express-validator'
import { ErrorWithStatus } from '~/models/errors'
import usersService from '~/services/users.services'
import { validate } from '~/utils/validation'

export const loginValidator = (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' })
  }
  next()
}

export const registerValidator = validate(
  checkSchema({
    name: {
      notEmpty: true,
      isString: true,
      trim: true,
      isLength: {
        options: {
          min: 1,
          max: 100
        }
      },
      errorMessage: 'Name must be between 1 and 100 characters long'
    },
    email: {
      notEmpty: true,
      isEmail: true,
      trim: true,
      custom: {
        options: async (value) => {
          const isExistEmail = await usersService.checkEmailExist(value)
          if (isExistEmail) {
            throw new ErrorWithStatus({ message: 'Email is already exists', status: 400 })
          }
          return true
        }
      },
      errorMessage: 'Invalid email address'
    },
    password: {
      notEmpty: true,
      isString: true,
      trim: true,
      isLength: {
        options: {
          min: 6,
          max: 50
        }
      },
      isStrongPassword: {
        options: {
          minLength: 6,
          minLowercase: 1,
          minUppercase: 1,
          minNumbers: 1,
          minSymbols: 1
        },
        errorMessage: 'Password must be at least 6 characters long and include uppercase, lowercase, number, and symbol'
      }
    },
    confirm_password: {
      notEmpty: true,
      isString: true,
      trim: true,
      isLength: {
        options: {
          min: 6,
          max: 50
        }
      },
      isStrongPassword: {
        options: {
          minLength: 6,
          minLowercase: 1,
          minUppercase: 1,
          minNumbers: 1,
          minSymbols: 1
        },
        errorMessage: 'Password must be at least 6 characters long and include uppercase, lowercase, number, and symbol'
      },
      custom: {
        options: (value, { req }) => value === req.body.password,
        errorMessage: 'Confirm password does not match password'
      }
    },
    date_of_birth: {
      isISO8601: {
        options: {
          strict: true,
          strictSeparator: true
        }
      },
      errorMessage: 'Invalid date of birth format'
    }
  })
)
