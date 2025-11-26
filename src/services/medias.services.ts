import { Request } from 'express'
import path from 'path'
import sharp from 'sharp'
import { UPLOAD_DIR } from '~/constants/dir'
import { handleUploadSingleImage } from '~/utils/file'
import fs from 'fs'

class MediasService {
  async uploadSingleImage(req: Request) {
    const file = await handleUploadSingleImage(req)
    const newFileName = file.newFilename.split('.')[0]
    const newFilePath = path.resolve(UPLOAD_DIR, `${newFileName}.jpeg`)
    await sharp(file.filepath).jpeg().toFile(newFilePath)
    fs.unlinkSync(file.filepath) // Xóa file tạm sau khi đã chuyển đổi và lưu
    return `http://localhost:4000/uploads/${newFileName}.jpeg`
  }
}

const mediasService = new MediasService()

export default mediasService
