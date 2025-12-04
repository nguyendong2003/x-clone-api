import { NextFunction, Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { UsersMessages } from '~/constants/messages'
import { TweetReqBody } from '~/models/requests/Tweet.requests'

export const createTweetController = async (req: Request<ParamsDictionary, unknown, TweetReqBody>, res: Response) => {
  return res.json({ message: UsersMessages.LOGIN_SUCCESS })
}
