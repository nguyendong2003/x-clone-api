import express from 'express'
import usersRouter from '~/routes/users.routes'
import databaseService from '~/services/database.services'
import { defaultErrorHandler } from '~/middlewares/error.middlewares'
import mediasRouter from '~/routes/medias.routes'
import { initFolderIfNotExists } from '~/utils/file'
import staticRouter from '~/routes/static.routes'
import { UPLOAD_VIDEO_DIR } from '~/constants/dir'
import cors, { CorsOptions } from 'cors'
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
import { EnvConfig, isProduction } from '~/config/config'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'

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

// Apply rate limiting to all requests
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
  standardHeaders: 'draft-8', // draft-6: `RateLimit-*` headers; draft-7 & draft-8: combined `RateLimit` header
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
  ipv6Subnet: 56 // Set to 60 or 64 to be less aggressive, or 52 or 48 to be more aggressive
  // store: ... , // Redis, Memcached, etc. See below.
})
app.use(limiter)

// Setup security middlewares (helmet, cors)
app.use(helmet())
const corsOptions: CorsOptions = {
  origin: isProduction ? EnvConfig.CLIENT_BASE_URL : '*'
}
app.use(cors(corsOptions))
//
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
