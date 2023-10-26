import express from 'express'
import usersRouter from './routes/users.routes'
import databaseService from './services/database.services'
import { defaultErrorHandler } from './middlewares/errors.middlewares'
import mediasRouter from './routes/medias.routes'
import { initFolder } from './utils/files'
import { config } from 'dotenv'
import staticRouter from './routes/static.routes'
import cors from 'cors'

config()
databaseService.connect()
initFolder()
const app = express()
const port = process.env.PORT || 4000
app.use(express.json())
app.use(cors())

app.use('/users', usersRouter)
app.use('/medias', mediasRouter)
app.use('/static', staticRouter)

app.use(defaultErrorHandler)

app.listen(port, () => {
  console.log(`Example app listening onport ${port}`)
})
