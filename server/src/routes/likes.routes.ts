import { Router } from 'express'
import { likesController, unLikeController } from '~/controllers/likes.controller'
import { tweetIdValidator } from '~/middlewares/tweet.middlewares'
import { accessTokenValidator, verifiedUserValidator } from '~/middlewares/users.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'
const likesRouter = Router()

likesRouter.post(
  '/',
  accessTokenValidator,
  verifiedUserValidator,
  tweetIdValidator,
  wrapRequestHandler(likesController)
)

/**
 * description: un bookmarks
 * path: /:tweet_id
 * method: delete
 * body: {tweet_id}
 * header: {authorization: bearer <accesstoken>}
 */
likesRouter.delete(
  '/tweets/:tweet_id',
  accessTokenValidator,
  verifiedUserValidator,
  tweetIdValidator,
  wrapRequestHandler(unLikeController)
)

export default likesRouter
