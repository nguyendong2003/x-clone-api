import { Router } from 'express'
import { createTweetController } from '~/controllers/tweets.controller'
import { tweetsValidator } from '~/middlewares/tweets.middleswares'
import { accessTokenValidator, verifiedUserValidator } from '~/middlewares/users.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'

const tweetsRouter = Router()

/**
 * Description: Create a tweet
 * Path: /tweets
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

export default tweetsRouter
