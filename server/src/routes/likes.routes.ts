import { Router } from 'express'
import { likesController } from '~/controllers/likes.controller'
import { accessTokenValidator, verifiedUserValidator } from '~/middlewares/users.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'
const likesRouter = Router()

likesRouter.post('/', accessTokenValidator, verifiedUserValidator, wrapRequestHandler(likesController))

export default likesRouter
