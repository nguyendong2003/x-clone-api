import { Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { BookmarksMessages } from '~/constants/messages'
import { BookmarkReqBody } from '~/models/requests/Bookmark.requests'
import { TokenPayload } from '~/models/requests/User.requests'
import bookmarksService from '~/services/bookmarks.services'

export const bookmarkController = async (req: Request<ParamsDictionary, unknown, BookmarkReqBody>, res: Response) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const { tweet_id } = req.body
  const result = await bookmarksService.bookmarkTweet(user_id, tweet_id)

  return res.json({ message: BookmarksMessages.BOOKMARK_SUCCESS, result })
}

export const unbookmarkController = async (req: Request, res: Response) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const { tweet_id } = req.params
  const result = await bookmarksService.unbookmarkTweet(user_id, tweet_id)

  return res.json({ message: BookmarksMessages.UNBOOKMARK_SUCCESS })
}
