import { Router } from 'express'
import {
  createTweetController,
  getNewFeedsController,
  getTweetChildrenController,
  getTweetController
} from '~/controllers/tweets.controller'
import {
  audienceValidator,
  getTweetChildrenValidator,
  paginationValidator,
  tweetIdValidator,
  tweetsValidator
} from '~/middlewares/tweets.middleswares'
import {
  accessTokenValidator,
  optionalAccessTokenValidator,
  verifiedUserValidator
} from '~/middlewares/users.middlewares'
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
 * Description: Get a tweet details
 * Path: /:tweet_id
 * Method: GET
 * Header: { Authorization: Bearer <access_token> } (Optional)
 */
tweetsRouter.get(
  '/:tweet_id',
  tweetIdValidator,
  // accessTokenValidator,
  // verifiedUserValidator,
  optionalAccessTokenValidator,
  audienceValidator,
  wrapRequestHandler(getTweetController)
)

/**
 * Description: Get tweet children with pagination
 * Path: /:tweet_id/children
 * Method: GET
 * Header: { Authorization: Bearer <access_token> } (Optional)
 * Query: { tweet_type: TweetType, limit : number, page: number}
 */
tweetsRouter.get(
  '/:tweet_id/children',
  tweetIdValidator,
  paginationValidator,
  getTweetChildrenValidator,
  optionalAccessTokenValidator,
  audienceValidator,
  wrapRequestHandler(getTweetChildrenController)
)

/**
 * Description: Get new feeds
 * Path: /
 * Method: GET
 * Header: { Authorization: Bearer <access_token> }
 * Query: { limit: number, page: number }
 */
tweetsRouter.get(
  '/',
  paginationValidator,
  accessTokenValidator,
  verifiedUserValidator,
  wrapRequestHandler(getNewFeedsController)
)

export default tweetsRouter
