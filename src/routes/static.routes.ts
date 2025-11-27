import { Router } from 'express'
import { serveImageController } from '~/controllers/medias.controllers'

const staticRouter = Router()

staticRouter.get('/image/:imageName', serveImageController)

export default staticRouter
