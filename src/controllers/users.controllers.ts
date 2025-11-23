import { NextFunction, Request, Response } from 'express'
import usersService from '~/services/users.services'
import { LogoutReqBody, RegisterReqBody } from '~/models/requests/User.requests'
import { ObjectId } from 'mongodb'
import User from '~/models/schemas/User.schemas'
import { UsersMessages } from '~/constants/messages'

export const loginController = async (req: Request, res: Response) => {
  const user = req.user as User
  const user_id = user._id as ObjectId
  const result = await usersService.login(user_id.toString())

  return res.json({ message: UsersMessages.LOGIN_SUCCESS, result })
}

export const registerController = async (
  req: Request<Record<string, unknown>, unknown, RegisterReqBody>,
  res: Response,
  next: NextFunction
) => {
  const result = await usersService.register(req.body)

  return res.json({ message: UsersMessages.REGISTER_SUCCESS, result })
}

export const logoutController = async (
  req: Request<Record<string, unknown>, unknown, LogoutReqBody>,
  res: Response
) => {
  const { refresh_token } = req.body
  await usersService.logout(refresh_token)

  return res.json({ message: UsersMessages.LOGOUT_SUCCESS })
}
