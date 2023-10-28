import { Router } from 'express'
import { bookmarksController, unBookmarksController } from '~/controllers/bookmarks.controller'
import { accessTokenValidator, verifiedUserValidator } from '~/middlewares/users.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'

const bookmarksRouter = Router()

/**
 * description: bookmarks
 * path: /
 * method: post
 * body: {tweet_id}
 * header: {authorization: bearer <accesstoken>}
 */
bookmarksRouter.post('/', accessTokenValidator, verifiedUserValidator, wrapRequestHandler(bookmarksController))

/**
 * description: un bookmarks
 * path: /:tweet_id
 * method: delete
 * body: {tweet_id}
 * header: {authorization: bearer <accesstoken>}
 */
bookmarksRouter.delete(
  '/tweets/:tweet_id',
  accessTokenValidator,
  verifiedUserValidator,
  wrapRequestHandler(unBookmarksController)
)

export default bookmarksRouter
