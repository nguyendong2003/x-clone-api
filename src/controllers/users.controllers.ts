import { NextFunction, Request, Response } from 'express'
import usersService from '~/services/users.services'
import { RegisterReqBody } from '~/models/requests/User.requests'

export const loginController = (req: Request, res: Response) => {
  const { email, password } = req.body
  if (email === 'dong@gmail.com' && password === '1') {
    return res.status(200).json({ message: 'Login successful' })
  }
  return res.status(401).json({ message: 'Invalid email or password' })
}

export const registerController = async (
  req: Request<Record<string, unknown>, unknown, RegisterReqBody>,
  res: Response,
  next: NextFunction
) => {
  const result = await usersService.register(req.body)

  return res.json({ message: 'Register successful', result })
}
