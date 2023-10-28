import { NextFunction, Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { TokenPayload } from '~/models/requests/User.requests'
import { LikeTweetReqBody } from '~/models/requests/Likes.reques'
import likesServices from '~/services/Likes.services'
import { LIKE_MESSAGES } from '~/constants/messages'

export const likesController = async (
  req: Request<ParamsDictionary, any, LikeTweetReqBody>,
  res: Response,
  next: NextFunction
) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const { tweet_id } = req.body
  const result = await likesServices.likeTweet(user_id, tweet_id)
  return res.json({
    message: LIKE_MESSAGES.LIKE_SUCCESSFULLY,
    data: result
  })
}
