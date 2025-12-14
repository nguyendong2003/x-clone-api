import { Router } from 'express'
import { bookmarkController, unbookmarkController } from '~/controllers/bookmarks.controllers'
import { tweetIdValidator } from '~/middlewares/tweets.middlewares'
import { accessTokenValidator, verifiedUserValidator } from '~/middlewares/users.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'

const bookmarksRouter = Router()

/**
 * Description: Bookmark a tweet
 * Path: /
 * Method: POST
 * Header: { Authorization: Bearer <access_token> }
 * Body: {tweet_id: string}
 */
bookmarksRouter.post(
  '/',
  accessTokenValidator,
  verifiedUserValidator,
  tweetIdValidator,
  wrapRequestHandler(bookmarkController)
)

/**
 * Description: Unbookmark a tweet
 * Path: /tweets/:tweet_id
 * Method: DELETE
 * Header: { Authorization: Bearer <access_token> }
 *
 * Lưu ý: Sử dụng DELETE không gửi body lên mà lấy trong params
 */
bookmarksRouter.delete(
  '/tweets/:tweet_id',
  accessTokenValidator,
  verifiedUserValidator,
  tweetIdValidator,
  wrapRequestHandler(unbookmarkController)
)
export default bookmarksRouter
