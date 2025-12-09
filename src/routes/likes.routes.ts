import { Router } from 'express'
import { likeTweetController, unlikeTweetController } from '~/controllers/likes.controllers'
import { tweetIdValidator } from '~/middlewares/tweets.middleswares'
import { accessTokenValidator, verifiedUserValidator } from '~/middlewares/users.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'

const likesRouter = Router()
/**
 * Description: Like Tweet
 * Path: /
 * Method: POST
 * Header: { Authorization: Bearer <access_token> }
 * Body: { tweet_id: string }
 */
likesRouter.post(
  '/',
  accessTokenValidator,
  verifiedUserValidator,
  tweetIdValidator,
  wrapRequestHandler(likeTweetController)
)

/**
 * Description: Unlike Tweet
 * Path: /tweets/:tweet_id
 * Method: DELETE
 * Header: { Authorization: Bearer <access_token> }
 */
likesRouter.delete(
  '/tweets/:tweet_id',
  accessTokenValidator,
  verifiedUserValidator,
  tweetIdValidator,
  wrapRequestHandler(unlikeTweetController)
)

export default likesRouter
