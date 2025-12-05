import { Router } from 'express'
import { createTweetController, getTweetController } from '~/controllers/tweets.controller'
import { audienceValidator, tweetIdValidator, tweetsValidator } from '~/middlewares/tweets.middleswares'
import { accessTokenValidator, verifiedUserValidator } from '~/middlewares/users.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'

const tweetsRouter = Router()

/**
 * Description: Create a tweet
 * Path: /
 * Method: POST
 * Body: TweetReqBody
 */
tweetsRouter.post(
  '/',
  accessTokenValidator,
  verifiedUserValidator,
  tweetsValidator,
  wrapRequestHandler(createTweetController)
)

/**
 * Description: Get a tweet
 * Path: /:tweet_id
 * Method: GET
 */
tweetsRouter.get(
  '/:tweet_id',
  tweetIdValidator,
  // accessTokenValidator,
  // verifiedUserValidator,
  audienceValidator,
  wrapRequestHandler(getTweetController)
)

export default tweetsRouter
