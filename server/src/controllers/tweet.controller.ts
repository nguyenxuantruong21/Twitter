import { NextFunction, Request, Response } from 'express'
import { TweetRequestBody } from '~/models/requests/Tweet.request'
import { ParamsDictionary } from 'express-serve-static-core'
import tweetsServices from '~/services/tweets.services'
import { TWEETS_MESSAGES } from '~/constants/messages'
import { TokenPayload } from '~/models/requests/User.requests'

export const createTweetController = async (
  req: Request<ParamsDictionary, any, TweetRequestBody>,
  res: Response,
  next: NextFunction
) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const result = await tweetsServices.createTweet(user_id, req.body)
  return res.json({
    message: 'Create tweet successfully!!',
    data: result
  })
}
