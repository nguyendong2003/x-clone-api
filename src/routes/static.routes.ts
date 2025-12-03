import { Router } from 'express'
import { serveImageController, serveVideoStreamController } from '~/controllers/medias.controllers'

const staticRouter = Router()

staticRouter.get('/image/:imageName', serveImageController)
staticRouter.get('/video-stream/:videoName', serveVideoStreamController)

export default staticRouter
