import { Request, Response } from 'express'
import path from 'path'
import { UPLOAD_IMAGE_DIR, UPLOAD_VIDEO_DIR } from '~/constants/dir'
import { HttpStatus } from '~/constants/httpStatus'
import { UsersMessages } from '~/constants/messages'
import mediasService from '~/services/medias.services'

export const uploadImageController = async (req: Request, res: Response) => {
  const imageUrl = await mediasService.uploadImage(req)
  return res.json({
    message: UsersMessages.UPLOAD_SUCCESS,
    result: imageUrl
  })
}

export const uploadVideoController = async (req: Request, res: Response) => {
  const videoUrl = await mediasService.uploadVideo(req)
  return res.json({
    message: UsersMessages.UPLOAD_SUCCESS,
    result: videoUrl
  })
}

export const serveImageController = async (req: Request, res: Response) => {
  const { imageName } = req.params
  return res.sendFile(path.resolve(UPLOAD_IMAGE_DIR, imageName), (err) => {
    if (err) {
      res.status(HttpStatus.NOT_FOUND).json({
        message: UsersMessages.IMAGE_NOT_FOUND
      })
    }
  })
}

export const serveVideoStreamController = async (req: Request, res: Response) => {
  const { videoName } = req.params
  return res.sendFile(path.resolve(UPLOAD_VIDEO_DIR, videoName), (err) => {
    if (err) {
      res.status(HttpStatus.NOT_FOUND).json({
        message: UsersMessages.VIDEO_NOT_FOUND
      })
    }
  })
}
