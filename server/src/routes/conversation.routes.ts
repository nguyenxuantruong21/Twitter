import { Router, request } from 'express'
import { getConversationsController } from '~/controllers/conversation.controller'
import { paginationValidator } from '~/middlewares/tweet.middlewares'
import { accessTokenValidator, getConversationsValidator, verifiedUserValidator } from '~/middlewares/users.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'
const conversationsRouter = Router()

conversationsRouter.get(
  '/receivers/:receiver_id',
  accessTokenValidator,
  verifiedUserValidator,
  getConversationsValidator,
  paginationValidator,
  wrapRequestHandler(getConversationsController)
)

export default conversationsRouter
