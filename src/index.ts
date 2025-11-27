import express from 'express'
import usersRouter from '~/routes/users.routes'
import databaseService from '~/services/database.services'
import { defaultErrorHandler } from '~/middlewares/error.middlewares'
import mediasRouter from '~/routes/medias.routes'
import { initFolderIfNotExists } from './utils/file'
import { config } from 'dotenv'
import { UPLOAD_DIR } from './constants/dir'

config()

databaseService.connect()

const app = express()
const port = process.env.PORT || 4000

// Init folder uploads
initFolderIfNotExists()

app.use(express.json()) // Middleware to parse JSON bodies
app.use('/users', usersRouter)
app.use('/medias', mediasRouter)
app.use('/static', express.static(UPLOAD_DIR)) // Serve static files from the uploads directory

// Global error handler
app.use(defaultErrorHandler)

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`)
})
