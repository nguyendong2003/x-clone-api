import { Request } from 'express'
import formidable, { File } from 'formidable'
import fs from 'fs'
import path from 'path'
import { UPLOAD_IMAGE_TEMP_DIR, UPLOAD_VIDEO_DIR } from '~/constants/dir'
import { nanoid } from 'nanoid'

export const initFolderIfNotExists = () => {
  const dirs = [UPLOAD_IMAGE_TEMP_DIR, UPLOAD_VIDEO_DIR]
  dirs.forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, {
        recursive: true // Create parent folders if they do not exist
      })
    }
  })
}

export const handleUploadImage = (req: Request) => {
  // Biến cờ để đánh dấu nếu có file không hợp lệ được phát hiện
  let isInvalidFileDetected = false

  const form = formidable({
    uploadDir: UPLOAD_IMAGE_TEMP_DIR,
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

export const handleUploadVideo = (req: Request) => {
  // Biến cờ để đánh dấu nếu có file không hợp lệ được phát hiện
  let isInvalidFileDetected = false

  const form = formidable({
    uploadDir: UPLOAD_VIDEO_DIR,
    maxFiles: 1,
    keepExtensions: true,
    maxFileSize: 100 * 1024 * 1024, // 100 MB

    // Loại bỏ form.emit() và đảm bảo luôn trả về boolean
    filter: ({ name, originalFilename, mimetype }) => {
      // Kiểm tra: name là 'video' và mimetype là 'video/*'
      const isValid = name === 'video' && Boolean(mimetype?.includes('mp4') || mimetype?.includes('quicktime'))

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
        // Trả về lỗi maxFilesExceeded
        return reject(err)
      }

      if (isInvalidFileDetected) {
        return reject(new Error('Invalid file type. Only video file is allowed.'))
      }

      // Tối ưu hóa: Kiểm tra xem tệp 'video' có tồn tại không
      const videoFiles = files.video
      if (!videoFiles || videoFiles.length === 0) {
        return reject(new Error('No video file uploaded or file field name is incorrect.'))
      }

      const uploadedFiles: File[] = []

      videoFiles.forEach((file) => {
        const extension = path.extname(file.originalFilename || '') // Lấy '.mp4'
        const oldPath = file.filepath // Đường dẫn file tạm thời của formidable

        // Lấy tên file ngẫu nhiên mà formidable đã tạo (ví dụ: a5wvcqxeqiptzib2xaxfh2lam)
        const filenameWithoutExt = path.parse(file.newFilename).name

        // Tên file mới: [Tên ngẫu nhiên] + [Extension sạch] (ví dụ: a5wvcqxeqiptzib2xaxfh2lam.mp4)
        const newFilename = `${filenameWithoutExt}${extension}`
        const newPath = path.join(UPLOAD_VIDEO_DIR, newFilename)

        // Đổi tên file vật lý
        fs.renameSync(oldPath, newPath)

        // Cập nhật lại thông tin file trong object formidable
        file.filepath = newPath
        file.newFilename = newFilename
        uploadedFiles.push(file)
      })

      resolve(uploadedFiles)
    })
  })
}
/*
  - Cách đặt tên:
    + Cách 1: Tạo unique id cho video ngay từ đầu  -> chọn cách này
    + Cách 2: Đợi video upload xong rồi tạo folder, move file vào folder đó

  - Cách xử lý khi upload video và encode HLS (có 2 giai đoạn)  => flow này giống upload video lên youtube:
    + Giai đoạn 1: Upload video thành công thì resolve về cho người dùng
    + Giai đoạn 2: Khai báo thêm 1 url endpoint để check xem video đó đã encode xong chưa
*/
export const handleUploadVideoHLS = (req: Request) => {
  // Biến cờ để đánh dấu nếu có file không hợp lệ được phát hiện
  let isInvalidFileDetected = false

  // Tạo thư mục tạm riêng cho mỗi lần upload
  const idName = nanoid()
  const folderPath = path.resolve(UPLOAD_VIDEO_DIR, idName)
  if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath)

  const form = formidable({
    uploadDir: folderPath,
    maxFiles: 1,
    keepExtensions: true,
    maxFileSize: 100 * 1024 * 1024, // 100 MB

    // Loại bỏ form.emit() và đảm bảo luôn trả về boolean
    filter: ({ name, originalFilename, mimetype }) => {
      // Kiểm tra: name là 'video' và mimetype là 'video/*'
      const isValid = name === 'video' && Boolean(mimetype?.includes('mp4') || mimetype?.includes('quicktime'))

      if (!isValid) {
        isInvalidFileDetected = true
      }

      // Trả về kết quả kiểm tra
      return isValid
    },
    filename: (name, ext, part, form) => {
      // Đặt tên file theo định dạng [idName].[extension] (ví dụ: a5wvcqxeqiptzib2xaxfh2lam.mp4)
      return `${idName}${ext}`
    }
  })

  return new Promise<File[]>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        // Trả về lỗi maxFilesExceeded
        return reject(err)
      }

      if (isInvalidFileDetected) {
        return reject(new Error('Invalid file type. Only video file is allowed.'))
      }

      // Tối ưu hóa: Kiểm tra xem tệp 'video' có tồn tại không
      const videoFiles = files.video
      if (!videoFiles || videoFiles.length === 0) {
        return reject(new Error('No video file uploaded or file field name is incorrect.'))
      }

      const uploadedFiles: File[] = videoFiles

      resolve(uploadedFiles)
    })
  })
}

export const getFiles = (dir: string, files: string[] = []) => {
  // Get an array of all files and directories in the passed directory using fs.readdirSync
  const fileList = fs.readdirSync(dir)
  // Create the full path of the file/directory by concatenating the passed directory and file/directory name
  for (const file of fileList) {
    const name = `${dir}/${file}`
    // Check if the current file/directory is a directory using fs.statSync
    if (fs.statSync(name).isDirectory()) {
      // If it is a directory, recursively call the getFiles function with the directory path and the files array
      getFiles(name, files)
    } else {
      // If it is a file, push the full path to the files array
      files.push(name)
    }
  }
  return files
}

/* --- IGNORE: Code version cũ v0 ---
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
