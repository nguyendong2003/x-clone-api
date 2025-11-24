import { NextFunction, Request, Response } from 'express'
import usersService from '~/services/users.services'
import {
  LoginReqBody,
  LogoutReqBody,
  RegisterReqBody,
  TokenPayload,
  VerifyEmailReqBody
} from '~/models/requests/User.requests'
import { ObjectId } from 'mongodb'
import User from '~/models/schemas/User.schemas'
import { UsersMessages } from '~/constants/messages'
import databaseService from '~/services/database.services'
import { HttpStatus } from '~/constants/httpStatus'
import { UserVerifyStatus } from '~/constants/enums'

export const loginController = async (req: Request<Record<string, unknown>, unknown, LoginReqBody>, res: Response) => {
  const user = req.user as User
  const user_id = user._id as ObjectId
  const result = await usersService.login(user_id.toString())

  return res.json({ message: UsersMessages.LOGIN_SUCCESS, result })
}

export const registerController = async (
  req: Request<Record<string, unknown>, unknown, RegisterReqBody>,
  res: Response
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

export const verifyEmailController = async (
  req: Request<Record<string, unknown>, unknown, VerifyEmailReqBody>,
  res: Response
) => {
  const { user_id } = req.decoded_email_verify_token as TokenPayload
  const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) })

  // Nếu không tìm thấy user thì trả về lỗi
  if (!user) {
    return res.status(HttpStatus.NOT_FOUND).json({ message: UsersMessages.USER_NOT_FOUND })
  }

  // Nếu đã verify rồi thì sẽ không báo lỗi mà chỉ trả về status OK với message là đã verify trước đó rồi
  if (user.email_verify_token === '') {
    return res.json({ message: UsersMessages.EMAIL_ALREADY_VERIFIED_BEFORE })
  }

  // Thực hiện verify email
  await usersService.verifyEmail(user_id)

  return res.json({ message: UsersMessages.EMAIL_VEFIFY_SUCCESS })
}

export const resendVerifyEmailController = async (req: Request, res: Response) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) })

  // Nếu không tìm thấy user thì trả về lỗi
  if (!user) {
    return res.status(HttpStatus.NOT_FOUND).json({ message: UsersMessages.USER_NOT_FOUND })
  }

  if (user.verify === UserVerifyStatus.Verified) {
    return res.json({ message: UsersMessages.EMAIL_ALREADY_VERIFIED_BEFORE })
  }

  await usersService.resendVerifyEmail(user_id)

  return res.json({ message: UsersMessages.RESEND_VERIFY_EMAIL_SUCCESS })
}
