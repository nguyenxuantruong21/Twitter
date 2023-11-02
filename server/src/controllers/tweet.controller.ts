import { NextFunction, Request, Response } from 'express'
import { Pagination, TweetParam, TweetQuery, TweetRequestBody } from '~/models/requests/Tweet.request'
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

export const getTweetController = async (req: Request, res: Response, next: NextFunction) => {
  const result = await tweetsServices.increaseView(req.params.tweet_id, req.decoded_authorization?.user_id)
  const tweet = {
    ...req.tweet,
    guest_views: result.guest_views,
    user_views: result.user_views,
    updated_at: result.updated_at
  }
  return res.json({
    message: 'Get tweet detail successfully!!',
    data: tweet
  })
}

export const getTweetChildrenController = async (
  req: Request<ParamsDictionary, any, TweetQuery>,
  res: Response,
  next: NextFunction
) => {
  const tweet_id = req.params.tweet_id
  const page = Number(req.query.page as string)
  const limit = Number(req.query.limit as string)
  const tweet_type = Number(req.query.tweet_type as string) as TweetType
  const user_id = req.decoded_authorization?.user_id
  const { tweets, total } = await tweetsServices.getTweetChildren({
    tweet_id,
    page,
    limit,
    tweet_type,
    user_id
  })
  return res.json({
    message: 'Get tweet children successfully!!',
    data: {
      tweets,
      tweet_type,
      page,
      limit,
      total_page: Math.ceil(total / limit)
    }
  })
}

export const getNewFeedsController = async (
  req: Request<ParamsDictionary, any, Pagination>,
  res: Response,
  next: NextFunction
) => {
  const user_id = req.decoded_authorization?.user_id as string
  const page = Number(req.query.page as string)
  const limit = Number(req.query.limit as string)
  const result = await tweetsServices.getNewFeeds({ user_id, limit, page })
  return res.json({
    message: 'Get New Feeds successfully!!',
    data: {
      tweets: result.tweets,
      limit,
      page,
      total_page: Math.ceil(result.total / limit)
    }
  })
}
