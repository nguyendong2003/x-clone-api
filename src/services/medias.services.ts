import { Request } from 'express'
import path from 'path'
import sharp from 'sharp'
import { UPLOAD_DIR } from '~/constants/dir'
import { handleUploadSingleImage } from '~/utils/file'
import fs from 'fs'
import { isProduction } from '~/config/config'
import { config } from 'dotenv'

config()

class MediasService {
  async uploadSingleImage(req: Request) {
    const file = await handleUploadSingleImage(req)
    const newFileName = file.newFilename.split('.')[0]
    const newFilePath = path.resolve(UPLOAD_DIR, `${newFileName}.jpg`)
    await sharp(file.filepath).jpeg().toFile(newFilePath)
    fs.unlinkSync(file.filepath) // Xóa file tạm sau khi đã chuyển đổi và lưu

    return isProduction
      ? `${process.env.BASE_URL}/static/${newFileName}.jpg`
      : `http://localhost:${process.env.PORT || 4000}/static/${newFileName}.jpg`
  }
}

const mediasService = new MediasService()

export default mediasService
