import { NextFunction, Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { BOOKMARK_MESSAGES } from '~/constants/messages'
import { TokenPayload } from '~/models/requests/User.requests'
import { BookMarksTweetReqBody } from '~/models/requests/Bookmarks.request'
import bookmarksServices from '~/services/bookmarks.services'

export const bookmarksController = async (
  req: Request<ParamsDictionary, any, BookMarksTweetReqBody>,
  res: Response,
  next: NextFunction
) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const { tweet_id } = req.body
  const result = await bookmarksServices.bookMarksTweet(user_id, tweet_id)
  return res.json({
    message: BOOKMARK_MESSAGES.BOOKMARK_SUCCESSFULLY,
    data: result
  })
}

export const unBookmarksController = async (req: Request, res: Response, next: NextFunction) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const { tweet_id } = req.params
  const result = await bookmarksServices.unBookMarksTweet(user_id, tweet_id)
  return res.json({
    message: BOOKMARK_MESSAGES.UNBOOKMARK_SUCCESSFULLY,
    data: result
  })
}
