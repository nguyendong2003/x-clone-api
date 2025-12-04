import { Router } from 'express'
import {
  serveImageController,
  serveVideoStreamController,
  serveSegmentController,
  serveM3u8Controller,
  serveSegmentTestController
} from '~/controllers/medias.controllers'

const staticRouter = Router()

staticRouter.get('/image/:imageName', serveImageController)
staticRouter.get('/video-stream/:videoName', serveVideoStreamController)
staticRouter.get('/video-hls/:id/master.m3u8', serveM3u8Controller)
staticRouter.get('/video-hls/:id/:v/:segment', serveSegmentController)

staticRouter.get('/video-hls/:id/:segment', serveSegmentTestController)

export default staticRouter
