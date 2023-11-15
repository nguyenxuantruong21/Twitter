import express from 'express'
import usersRouter from './routes/users.routes'
import databaseService from './services/database.services'
import { defaultErrorHandler } from './middlewares/errors.middlewares'
import mediasRouter from './routes/medias.routes'
import { initFolder } from './utils/files'
import { config } from 'dotenv'
import staticRouter from './routes/static.routes'
import cors from 'cors'
import tweetRouter from './routes/tweet.routes'
import bookmarksRouter from './routes/bookmarks.routes'
import likesRouter from './routes/likes.routes'
import searchRouter from './routes/search.routes'
import { createServer } from 'http'
import { Server } from 'socket.io'
import Conversation from './models/schemas/Conversation.schema'
import conversationsRouter from './routes/conversation.routes'
import { ObjectId } from 'mongodb'
config()
databaseService.connect().then(() => {
  databaseService.indexUser()
  databaseService.indexRefreshToken()
  databaseService.indexVideoStatus()
  databaseService.indexFollower()
  databaseService.indexTweets()
})
initFolder()
const app = express()
const httpServer = createServer(app)

const port = process.env.PORT || 4000
app.use(express.json())
app.use(cors())

app.use('/users', usersRouter)
app.use('/medias', mediasRouter)
app.use('/static', staticRouter)
app.use('/tweets', tweetRouter)
app.use('/bookmarks', bookmarksRouter)
app.use('/likes', likesRouter)
app.use('/search', searchRouter)
app.use('/conversations', conversationsRouter)

app.use(defaultErrorHandler)

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
io.on('connection', (socket) => {
  console.log(`user ${socket.id} connected`)
  // user id client 1
  const user_id = socket.handshake.auth._id
  users[user_id] = {
    socket_id: socket.id
  }
  socket.on('private message', async (data) => {
    const receiver_socket_id = users[data.to].socket_id
    if (!receiver_socket_id) return
    await databaseService.conversations.insertOne(
      new Conversation({
        sender_id: new ObjectId(data.from),
        receiver_id: new ObjectId(data.to),
        content: data.content
      })
    )
    socket.to(receiver_socket_id).emit('receive private message', {
      content: data.content,
      from: user_id
    })
  })
  socket.on('disconnect', () => {
    delete users[user_id]
    console.log(`user ${socket.id} disconnected`)
  })
})

httpServer.listen(port, () => {
  console.log(`Example app listening onport ${port}`)
})
