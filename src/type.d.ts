import { Request } from 'express'
import User from '~/models/schemas/User.schemas'

// mở rộng interface Request của express để thêm thuộc tính user
declare module 'express' {
  interface Request {
    user?: User
  }
}
