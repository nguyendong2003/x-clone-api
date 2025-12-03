import { Request } from 'express'
import path from 'path'
import sharp from 'sharp'
import { UPLOAD_IMAGE_DIR } from '~/constants/dir'
import { handleUploadImage, handleUploadVideo } from '~/utils/file'
import fs from 'fs'
import { isProduction } from '~/config/config'
import { config } from 'dotenv'
import { MediaType } from '~/constants/enums'
import { Media } from '~/models/Other'

config()

class MediasService {
  async uploadImage(req: Request) {
    const files = await handleUploadImage(req)
    const result: Media[] = await Promise.all(
      files.map(async (file) => {
        const newFileName = file.newFilename.split('.')[0]
        const newFilePath = path.resolve(UPLOAD_IMAGE_DIR, `${newFileName}.jpg`)
        await sharp(file.filepath).jpeg().toFile(newFilePath)
        fs.unlinkSync(file.filepath) // Xóa file tạm sau khi đã chuyển đổi và lưu

        return {
          url: isProduction
            ? `${process.env.BASE_URL}/static/image/${newFileName}.jpg`
            : `http://localhost:${process.env.PORT}/static/image/${newFileName}.jpg`,
          type: MediaType.Image
        }
      })
    )

    return result
  }

  async uploadVideo(req: Request) {
    const files = await handleUploadVideo(req)
    const result: Media[] = files.map((file) => {
      const newFileName = file.newFilename
      return {
        url: isProduction
          ? `${process.env.BASE_URL}/static/video/${newFileName}`
          : `http://localhost:${process.env.PORT}/static/video/${newFileName}`,
        type: MediaType.Video
      }
    })

    return result
  }
}

const mediasService = new MediasService()

export default mediasService
