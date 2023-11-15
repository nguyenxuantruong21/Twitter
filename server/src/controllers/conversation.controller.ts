import { NextFunction, Request, Response } from 'express'
import conversationService from '~/services/conversations.services'

export const getConversationsController = async (req: Request, res: Response) => {
  const { receiver_id } = req.params
  const sender_id = req.decoded_authorization?.user_id as string
  const page = Number(req.query.page)
  const limit = Number(req.query.limit)
  const result = await conversationService.getConversations({
    sender_id,
    receiver_id,
    page: page,
    limit: limit
  })
  return res.json({
    message: 'Get conversations successfully!!',
    data: result,
    limit,
    page,
    total_page: Math.ceil(result.total / limit)
  })
}
