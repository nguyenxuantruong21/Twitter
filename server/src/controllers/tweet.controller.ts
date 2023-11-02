import { NextFunction, Request, Response } from 'express'
import { TweetRequestBody } from '~/models/requests/Tweet.request'
import { ParamsDictionary } from 'express-serve-static-core'
import tweetsServices from '~/services/tweets.services'
import { TokenPayload } from '~/models/requests/User.requests'
import { TweetType } from '~/constants/enum'

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

export const getTweetController = async (
  req: Request<ParamsDictionary, any, TweetRequestBody>,
  res: Response,
  next: NextFunction
) => {
  const result = await tweetsServices.increaseView(req.params.tweet_id, req.decoded_authorization?.user_id)
  const tweet = {
    ...req.tweet,
    guest_views: result.guest_views,
    user_views: result.user_views
  }
  return res.json({
    message: 'Get tweet detail successfully!!',
    data: tweet
  })
}

export const getTweetChildrenController = async (
  req: Request<ParamsDictionary, any, TweetRequestBody>,
  res: Response,
  next: NextFunction
) => {
  const result = await tweetsServices.getTweetChildren({
    tweet_id: req.params.tweet_id,
    page: Number(req.query.page as string),
    limit: Number(req.query.limit as string),
    tweet_type: Number(req.query.tweet_type as string) as TweetType
  })
  return res.json({
    message: 'Get tweet children successfully!!',
    data: result
  })
}
