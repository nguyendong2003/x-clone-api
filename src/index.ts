import express from 'express'
import usersRouter from '~/routes/users.routes'
import databaseService from '~/services/database.services'
import { defaultErrorHandler } from '~/middlewares/error.middlewares'
import mediasRouter from '~/routes/medias.routes'
import { initFolderIfNotExists } from '~/utils/file'
import staticRouter from '~/routes/static.routes'
import { UPLOAD_VIDEO_DIR } from '~/constants/dir'
import cors from 'cors'
import tweetsRouter from '~/routes/tweets.routes'
import bookmarksRouter from '~/routes/bookmarks.routes'
import searchRouter from '~/routes/search.routes'
import likesRouter from '~/routes/likes.routes'
import conversationsRouter from '~/routes/conversations.routes'
import { createServer } from 'http'
import initSocket from '~/utils/socket'
import YAML from 'yaml'
import fs from 'fs'
import path from 'path'
import swaggerUi from 'swagger-ui-express'
import { EnvConfig } from '~/config/config'

// Load Swagger document
const file = fs.readFileSync(path.resolve('swagger.yaml'), 'utf8')
const swaggerDocument = YAML.parse(file)

/**
 * File này chỉ để fake dữ liệu khi dev, chỉ cần uncomment này lên và chạy server thì sẽ chạy file này tiếp, vì vậy khi chạy xong thì comment dòng này lại
 */
// import '~/utils/fake' // Chạy file fake dữ liệu

// Kết nối đến database khi khởi động server và tạo index cho collection users
databaseService.connect().then(() => {
  databaseService.indexUsers()
  databaseService.indexRefreshTokens()
  databaseService.indexVideoStatus()
  databaseService.indexFollowers()
  databaseService.indexTweets()
})

const app = express()

// Create HTTP server to use with socket.io
const httpServer = createServer(app)

app.use(cors())
const PORT = EnvConfig.PORT

// Init folder uploads
initFolderIfNotExists()

app.use(express.json()) // Middleware to parse JSON bodies
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))
app.use('/users', usersRouter)
app.use('/medias', mediasRouter)
app.use('/tweets', tweetsRouter)
app.use('/bookmarks', bookmarksRouter)
app.use('/likes', likesRouter)
app.use('/search', searchRouter)
app.use('/conversations', conversationsRouter)
app.use('/static', staticRouter) // cách 2: Sử dụng router để phục vụ file tĩnh
app.use('/static/video', express.static(UPLOAD_VIDEO_DIR))
// app.use('/static', express.static(UPLOAD_IMAGE_DIR)) // cách 1: Serve static files from the uploads directory

// Global error handler
app.use(defaultErrorHandler)

// Init socket.io
initSocket(httpServer)

httpServer.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`)
})
