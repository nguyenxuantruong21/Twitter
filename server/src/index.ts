import express from 'express'
import usersRouter from './routes/users.routes'
import databaseService from './services/database.services'
import { defaultErrorHandler } from './middlewares/errors.middlewares'
import mediasRouter from './routes/medias.routes'
import { initFolder } from './utils/files'

databaseService.connect()
const app = express()
const port = 4000

app.use(express.json())
// tao
initFolder()

app.use('/users', usersRouter)
app.use('/medias', mediasRouter)

app.use(defaultErrorHandler)

app.listen(port, () => {
  console.log(`Example app listening onport ${port}`)
})
