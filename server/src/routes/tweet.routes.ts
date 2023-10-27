import { Router } from 'express'
import { createTweetController } from '~/controllers/tweet.controller'
import { createTweetValidator } from '~/middlewares/tweet.middlewares'
import { accessTokenValidator, verifiedUserValidator } from '~/middlewares/users.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'
const tweetRouter = Router()

/**
 * Create Post
 * method:POST
 * paht: /
 * Body: Tweet request body
 */
tweetRouter.post(
  '/',
  accessTokenValidator,
  verifiedUserValidator,
  createTweetValidator,
  wrapRequestHandler(createTweetController)
)

export default tweetRouter
