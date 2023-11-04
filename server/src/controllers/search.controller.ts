import { NextFunction, Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { MediaQuery } from '~/constants/enum'
import { SearchQuery } from '~/models/requests/Search.request'
import searchServices from '~/services/search.services'

export const searchController = async (
  req: Request<ParamsDictionary, any, any, SearchQuery>,
  res: Response,
  next: NextFunction
) => {
  const user_id = req.decoded_authorization?.user_id as string
  const limit = Number(req.query.limit as string)
  const page = Number(req.query.page as string)
  const result = await searchServices.search({
    limit,
    page,
    content: req.query.content as string,
    user_id,
    media_type: req.query.media_type as MediaQuery,
    people_follow: req.query.people_follow
  })
  return res.json({
    message: 'Search Successfully',
    result: {
      tweets: result.tweets,
      limit,
      page,
      total_page: Math.ceil(result.total / limit)
    }
  })
}
