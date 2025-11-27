import { Request, Response } from 'express'
import path from 'path'
import { UPLOAD_DIR } from '~/constants/dir'
import { HttpStatus } from '~/constants/httpStatus'
import { UsersMessages } from '~/constants/messages'
import mediasService from '~/services/medias.services'

export const uploadSingleImageController = async (req: Request, res: Response) => {
  const imageUrl = await mediasService.uploadSingleImage(req)
  return res.json({
    message: UsersMessages.UPLOAD_SUCCESS,
    result: imageUrl
  })
}

export const serveImageController = async (req: Request, res: Response) => {
  const { imageName } = req.params
  return res.sendFile(path.resolve(UPLOAD_DIR, imageName), (err) => {
    if (err) {
      res.status(HttpStatus.NOT_FOUND).json({
        message: UsersMessages.IMAGE_NOT_FOUND
      })
    }
  })
}
