import express from 'express'
import { ValidationChain, validationResult } from 'express-validator'
import { RunnableValidationChains } from 'express-validator/lib/middlewares/schema'
import httpStatus from '~/constants/httpStatus'
import { ErrorWithStatus } from '~/models/errors'

// can be reused by many routes
export const validate = (validation: RunnableValidationChains<ValidationChain>) => {
  return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    // sequential processing, stops running validations chain if one fails.
    await validation.run(req)
    const errors = validationResult(req)
    const errorsObject = errors.mapped()
    for (const key in errorsObject) {
      const { msg } = errorsObject[key]
      if (msg instanceof ErrorWithStatus && msg.status !== httpStatus.UNPROCESSABLE_ENTITY) {
        return next(msg)
      }
    }
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.mapped() })
    }

    next()
  }
}
