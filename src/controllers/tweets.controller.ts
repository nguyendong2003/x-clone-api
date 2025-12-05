import { Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { result } from 'lodash'
import { TweetsMessages } from '~/constants/messages'
import { TweetReqBody } from '~/models/requests/Tweet.requests'
import { TokenPayload } from '~/models/requests/User.requests'
import tweetsService from '~/services/tweets.services'

export const createTweetController = async (req: Request<ParamsDictionary, unknown, TweetReqBody>, res: Response) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const result = await tweetsService.createTweet(user_id, req.body)

  return res.json({ message: TweetsMessages.TWEET_CREATE_SUCCESS, result })
}

export const getTweetController = async (req: Request<ParamsDictionary, unknown, TweetReqBody>, res: Response) => {
  // const { user_id } = req.decoded_authorization as TokenPayload
  // const result = await tweetsService.createTweet(user_id, req.body)

  return res.json({ message: TweetsMessages.GET_TWEET_SUCCESS, result: req.tweet })
}
