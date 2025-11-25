import { Request, Response, NextFunction } from 'express'
import { pick } from 'lodash'

type FilterKeys<T> = Array<keyof T>

// Middleware để req.body chỉ lấy các trường được phép (filterKeys là mảng các key của T)
export const filterMiddleware =
  <T>(filterKeys: FilterKeys<T>) =>
  (req: Request, res: Response, next: NextFunction) => {
    req.body = pick(req.body, filterKeys)
    next()
  }
