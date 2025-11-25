import { NextFunction, Request, Response } from 'express'
import usersService from '~/services/users.services'
import {
  ForgotPasswordReqBody,
  LoginReqBody,
  LogoutReqBody,
  RegisterReqBody,
  ResetPasswordReqBody,
  TokenPayload,
  UpdateMeReqBody,
  VerifyEmailReqBody,
  VerifyForgotPasswordReqBody
} from '~/models/requests/User.requests'
import { ObjectId } from 'mongodb'
import User from '~/models/schemas/User.schemas'
import { UsersMessages } from '~/constants/messages'
import { HttpStatus } from '~/constants/httpStatus'
import { UserVerifyStatus } from '~/constants/enums'
import { pick } from 'lodash'

export const loginController = async (req: Request<Record<string, unknown>, unknown, LoginReqBody>, res: Response) => {
  const user = req.user as User
  const user_id = user._id as ObjectId
  const result = await usersService.login({ user_id: String(user_id), verify: user.verify })

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
  const user = await usersService.getUserById(user_id)

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
  const user = await usersService.getUserById(user_id)

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

export const forgotPasswordController = async (
  req: Request<Record<string, unknown>, unknown, ForgotPasswordReqBody>,
  res: Response
) => {
  const { _id, verify } = req.user as User
  await usersService.forgotPassword({ user_id: String(_id), verify })
  return res.json({ message: UsersMessages.EMAIL_FORGOT_PASSWORD_SUBMIT_SUCCESS })
}

export const verifyForgotPasswordController = async (
  req: Request<Record<string, unknown>, unknown, VerifyForgotPasswordReqBody>,
  res: Response
) => {
  return res.json({ message: UsersMessages.VERIFY_FORGOT_PASSWORD_SUCCESS })
}

export const resetPasswordController = async (
  req: Request<Record<string, unknown>, unknown, ResetPasswordReqBody>,
  res: Response
) => {
  const { user_id } = req.decoded_forgot_password_token as TokenPayload
  const { password } = req.body
  await usersService.resetPassword(user_id, password)
  return res.json({ message: UsersMessages.RESET_PASSWORD_SUCCESS })
}

export const getMeController = async (req: Request, res: Response, next: NextFunction) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const user = await usersService.getUserByIdPublic(user_id)

  // Nếu không tìm thấy user thì trả về lỗi
  if (!user) {
    return res.status(HttpStatus.NOT_FOUND).json({ message: UsersMessages.USER_NOT_FOUND })
  }

  return res.json({ message: UsersMessages.GET_ME_SUCCESS, result: user })
}

export const updateMeController = async (
  req: Request<Record<string, unknown>, unknown, UpdateMeReqBody>,
  res: Response
) => {
  const { user_id } = req.decoded_authorization as TokenPayload

  const payload = req.body
  const updatedUser = await usersService.updateMe(user_id, payload)

  if (!updatedUser) {
    return res.status(HttpStatus.NOT_FOUND).json({ message: UsersMessages.USER_NOT_FOUND })
  }

  return res.json({ message: UsersMessages.UPDATE_ME_SUCCESS, result: updatedUser })
}
