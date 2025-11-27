import { Request, Response } from 'express'
import { UsersMessages } from '~/constants/messages'
import mediasService from '~/services/medias.services'

export const uploadSingleImageController = async (req: Request, res: Response) => {
  const imageUrl = await mediasService.uploadSingleImage(req)
  return res.json({
    message: UsersMessages.UPLOAD_SUCCESS,
    result: imageUrl
  })
}
