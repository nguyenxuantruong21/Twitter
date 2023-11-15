import { Router, request } from 'express'
import { getConversationsController } from '~/controllers/conversation.controller'
import { accessTokenValidator, verifiedUserValidator } from '~/middlewares/users.middlewares'
const conversationsRouter = Router()

conversationsRouter.get(
  '/receivers/:receiver_id',
  accessTokenValidator,
  verifiedUserValidator,
  getConversationsController
)

export default conversationsRouter
