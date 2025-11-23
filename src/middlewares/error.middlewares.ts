import { NextFunction, Request, Response } from 'express'
import { omit } from 'lodash'
import { HttpStatus } from '~/constants/httpStatus'

export const defaultErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  // loại bỏ thuộc tính status khỏi body err khi trả về response
  res.status(err.status || HttpStatus.INTERNAL_SERVER_ERROR).json(omit(err, ['status']))
}
