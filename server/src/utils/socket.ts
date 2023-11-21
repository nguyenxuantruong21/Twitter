import { Server } from 'socket.io'
import { ObjectId } from 'mongodb'
import databaseService from '~/services/database.services'
import { verifyAccessToken } from './commons'
import { TokenPayload } from '~/models/requests/User.requests'
import { UserVerifyStatus } from '~/constants/enum'
import { ErrorWithStatus } from '~/models/Errors'
import { USERS_MESSAGES } from '~/constants/messages'
import HTTP_STATUS from '~/constants/httpStatusCode'
import Conversation from '~/models/schemas/Conversation.schema'
import { Server as ServerHTTP } from 'http'

const initSocket = (httpServer: ServerHTTP) => {
  const io = new Server(httpServer, {
    cors: {
      origin: 'http://localhost:3000'
    }
  })

  // get socket id
  const users: {
    [key: string]: {
      socket_id: string
    }
  } = {}

  // middleware in socket io
  io.use(async (socket, next) => {
    const { Authorization } = socket.handshake.auth
    const access_token = Authorization?.split(' ')[1]
    if (!access_token) {
      try {
        const decoded_authorization = await verifyAccessToken(access_token)
        const { verify } = decoded_authorization as TokenPayload
        if (verify !== UserVerifyStatus.Verified) {
          throw new ErrorWithStatus({
            message: USERS_MESSAGES.USER_NOT_VERIFIED,
            status: HTTP_STATUS.FORBIDDEN
          })
        }
        socket.handshake.auth.decoded_authorization = decoded_authorization
        socket.handshake.auth.access_token = access_token
        next()
      } catch (error) {
        next({
          message: 'Unauthorized',
          name: 'UnauthorizesError',
          data: error
        })
      }
    }
  })

  io.on('connection', (socket) => {
    console.log(`user ${socket.id} connected`)
    // user id client 1
    const { user_id } = socket.handshake.auth.decoded_authorization as TokenPayload
    users[user_id] = {
      socket_id: socket.id
    }
    // middelware
    socket.use(async (packet, next) => {
      const { access_token } = socket.handshake.auth
      try {
        await verifyAccessToken(access_token)
        next()
      } catch (error) {
        next(new Error('Unauthorized'))
      }
    })

    socket.on('error', (error) => {
      if (error.message === 'Unauthorized') {
        socket.disconnect()
      }
    })

    // send message
    socket.on('send_message', async (data) => {
      const { receiver_id, sender_id, content } = data.payload
      // check socket id exist
      const receiver_socket_id = users[receiver_id].socket_id
      // create message sent to client 2
      const conversation = new Conversation({
        sender_id: new ObjectId(sender_id),
        receiver_id: new ObjectId(receiver_id),
        content: content
      })
      // insert in database
      const result = await databaseService.conversations.insertOne(conversation)
      conversation._id = result.insertedId
      if (receiver_socket_id) {
        socket.to(receiver_socket_id).emit('receive_message', {
          payload: conversation
        })
      }
    })
    socket.on('disconnect', () => {
      delete users[user_id]
      console.log(`user ${socket.id} disconnected`)
    })
  })
}

export default initSocket
