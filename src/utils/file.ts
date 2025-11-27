import { Request } from 'express'
import formidable, { File } from 'formidable'
import fs from 'fs'
import { UPLOAD_TEMP_DIR } from '~/constants/dir'

export const initFolderIfNotExists = () => {
  const uploadFolderPath = UPLOAD_TEMP_DIR
  if (!fs.existsSync(uploadFolderPath)) {
    fs.mkdirSync(uploadFolderPath, {
      recursive: true // Create parent folders if they do not exist
    })
  }
}

export const handleUploadImage = (req: Request) => {
  // Biến cờ để đánh dấu nếu có file không hợp lệ được phát hiện
  let isInvalidFileDetected = false

  const form = formidable({
    uploadDir: UPLOAD_TEMP_DIR,
    maxFiles: 4,
    keepExtensions: true,
    maxFileSize: 500 * 1024, // 500 KB,
    maxTotalFileSize: 500 * 1024 * 4, // 4 files, each max 500 KB

    // Loại bỏ form.emit() và đảm bảo luôn trả về boolean
    filter: ({ name, originalFilename, mimetype }) => {
      // Kiểm tra: name là 'image' và mimetype là 'image/*'
      const isValid = name === 'image' && !!mimetype && mimetype.startsWith('image/')

      if (!isValid) {
        isInvalidFileDetected = true
      }

      // Trả về kết quả kiểm tra
      return isValid
    }
  })

  return new Promise<File[]>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        // Xử lý lỗi hệ thống (maxFiles, maxFieldsSize, IO errors...)
        return reject(err)
      }

      if (isInvalidFileDetected) {
        return reject(new Error('Invalid file type. Only image files are allowed.'))
      }

      // Tối ưu hóa: Kiểm tra xem tệp 'image' có tồn tại không
      const imageFiles = files.image

      if (!imageFiles || imageFiles.length === 0) {
        return reject(new Error('No image file uploaded or file field name is incorrect.'))
      }

      resolve(imageFiles)
    })
  })
}

/* --- IGNORE: Code version cũ ---
export const handleUploadSingleImage = async (req: Request) => {
  const form = formidable({
    uploadDir: path.resolve('uploads'), // Directory to save uploaded files
    maxFiles: 1,
    keepExtensions: true,
    maxFileSize: 1 * 1024 * 1024, // 1 MB
    filter: ({ name, originalFilename, mimetype }) => {
      const valid = name === 'image' && Boolean(mimetype?.startsWith('image/'))
      if (!valid) {
        form.emit('error' as any, new Error('Invalid file type. Only image files are allowed.') as any)
      }

      return valid
    }
  })

  // Phải trả về Promise chứ không dùng form.parse với callback và throw err được
  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        return reject(err)
      }
      if (!files.image) {
        return reject(new Error('No image file uploaded'))
      }

      resolve({ fields, files })
    })
  })
}
*/
