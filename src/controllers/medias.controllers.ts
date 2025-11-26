import { Request, Response } from 'express'
import mediasService from '~/services/medias.services'

export const uploadSingleImageController = async (req: Request, res: Response) => {
  const imageUrl = await mediasService.uploadSingleImage(req)
  res.json({ result: imageUrl })
}
