import { Router } from 'express'
import {
  createTweetController,
  getNewFeedsController,
  getTweetChildrenController,
  getTweetController
} from '~/controllers/tweet.controller'
import {
  audienceValidator,
  createTweetValidator,
  getTweetChildrenValidator,
  paginationValidator,
  tweetIdValidator
} from '~/middlewares/tweet.middlewares'
import { accessTokenValidator, isUserLoggedValidator, verifiedUserValidator } from '~/middlewares/users.middlewares'
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

/**
 * Get Tweet
 * method:GET
 * path: /tweet_id
 */
tweetRouter.get(
  '/:tweet_id',
  tweetIdValidator,
  isUserLoggedValidator(accessTokenValidator),
  isUserLoggedValidator(verifiedUserValidator),
  audienceValidator,
  wrapRequestHandler(getTweetController)
)

/**
 * Get Tweet Children
 * method: GET
 * path: /tweet_id/children
 * header: { authorization: bearer: {access_token}
 * query: {limit: number, page: number, tweet_type}
 */
tweetRouter.get(
  '/:tweet_id/children',
  tweetIdValidator,
  isUserLoggedValidator(accessTokenValidator),
  isUserLoggedValidator(verifiedUserValidator),
  audienceValidator,
  getTweetChildrenValidator,
  wrapRequestHandler(getTweetChildrenController)
)

/**
 * Get New feeds
 * method: GET
 * path: /new-feeds
 * header: { authorization: bearer: {access_token}
 * query: {limit: number, page: number}
 */
tweetRouter.get(
  '/',
  paginationValidator,
  accessTokenValidator,
  verifiedUserValidator,
  wrapRequestHandler(getNewFeedsController)
)

export default tweetRouter
