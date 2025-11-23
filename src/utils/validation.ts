import express from 'express'
import { ValidationChain, validationResult } from 'express-validator'
import { RunnableValidationChains } from 'express-validator/lib/middlewares/schema'
import { HttpStatus } from '~/constants/httpStatus'
import { EntityError, ErrorWithStatus } from '~/models/Errors'

// can be reused by many routes
export const validate = (validation: RunnableValidationChains<ValidationChain>) => {
  return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    // sequential processing, stops running validations chain if one fails.
    await validation.run(req)
    const errors = validationResult(req)
    // no errors then continue to next middleware/controller
    if (errors.isEmpty()) {
      return next()
    }
    // errors exist
    const errorsObject = errors.mapped()
    const entityError = new EntityError({ errors: {} })
    for (const key in errorsObject) {
      const { msg } = errorsObject[key]
      if (msg instanceof ErrorWithStatus && msg.status !== HttpStatus.UNPROCESSABLE_ENTITY) {
        return next(msg)
      }

      entityError.errors[key] = errorsObject[key]
    }

    next(entityError)
  }
}
