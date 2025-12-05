import { Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { TweetsMessages } from '~/constants/messages'
import { TweetChildrenParams, TweetChildrenQuery, TweetReqBody } from '~/models/requests/Tweet.requests'
import { TokenPayload } from '~/models/requests/User.requests'
import tweetsService from '~/services/tweets.services'

export const createTweetController = async (req: Request<ParamsDictionary, unknown, TweetReqBody>, res: Response) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const result = await tweetsService.createTweet(user_id, req.body)

  return res.json({ message: TweetsMessages.TWEET_CREATE_SUCCESS, result })
}

export const getTweetController = async (req: Request<ParamsDictionary, unknown, TweetReqBody>, res: Response) => {
  const result = await tweetsService.increaseTweetView(req.params.tweet_id, req.decoded_authorization?.user_id)
  const tweet = {
    ...req.tweet,
    user_views: result.user_views,
    guest_views: result.guest_views,
    updated_at: result.updated_at
  }

  return res.json({ message: TweetsMessages.GET_TWEET_SUCCESS, result: tweet })
}

export const getTweetChildrenController = async (
  req: Request<TweetChildrenParams, unknown, unknown, TweetChildrenQuery>,
  res: Response
) => {
  const { tweet_id } = req.params
  const { tweet_type, limit, page } = req.query
  const { user_id } = req.decoded_authorization || {}

  const parsedTweetType = Number(tweet_type)
  const parsedLimit = Number(limit)
  const parsedPage = Number(page)

  const { tweets, total } = await tweetsService.getTweetChildren({
    tweet_id,
    tweet_type: parsedTweetType,
    limit: parsedLimit,
    page: parsedPage,
    user_id
  })

  return res.json({
    message: TweetsMessages.GET_TWEET_CHILDREN_SUCCESS,
    result: {
      tweets,
      tweet_type: parsedTweetType,
      pagination: {
        limit: parsedLimit,
        page: parsedPage,
        total_page: Math.ceil(total / parsedLimit)
      }
    }
  })
}
