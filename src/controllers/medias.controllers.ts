import { Request, Response } from 'express'
import path from 'path'
import { UPLOAD_IMAGE_DIR, UPLOAD_VIDEO_DIR } from '~/constants/dir'
import { HttpStatus } from '~/constants/httpStatus'
import { UsersMessages } from '~/constants/messages'
import mediasService from '~/services/medias.services'
import fs from 'fs'
import mime from 'mime'

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

export const uploadVideoHLSController = async (req: Request, res: Response) => {
  const videoUrl = await mediasService.uploadVideoHLS(req)
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
  const { range } = req.headers
  if (!range) {
    return res.status(HttpStatus.BAD_REQUEST).json({
      message: UsersMessages.VIDEO_RANGE_HEADER_REQUIRED
    })
  }

  const { videoName } = req.params
  const videoPath = path.resolve(UPLOAD_VIDEO_DIR, videoName)

  // 1MB = 10^6 bytes = 2^20 bytes (1024 * 1024)

  // Dung lượng video (bytes)
  const videoSize = fs.statSync(videoPath).size

  // Dung lượng video cho mỗi phân đoạn stream
  const chunkSize = 10 ** 6 // 1MB

  // Lấy vị trí bắt đầu phân đoạn từ header 'Range' (vd: bytes=1048576-)
  const start = Number(range.replace(/\D/g, ''))

  // Lấy giá trị byte kết thúc của phân đoạn, vượt quá dung lượng video thì lấy bằng dung lượng video - 1 (videoSize - 1)
  const end = Math.min(start + chunkSize, videoSize - 1)

  // Dung lượng thực tế cho mỗi đoạn video stream
  // Thường đây là chunkSize, ngoại trừ đoạn cuối cùng có thể nhỏ hơn
  const contentLength = end - start + 1
  const contentType = mime.getType(videoPath) || 'video/*'
  const headers = {
    'Content-Range': `bytes ${start}-${end}/${videoSize}`,
    'Accept-Ranges': 'bytes',
    'Content-Length': contentLength,
    'Content-Type': contentType
  }
  res.writeHead(HttpStatus.PARTIAL_CONTENT, headers)

  const videoStream = fs.createReadStream(videoPath, { start, end })
  videoStream.pipe(res)
}

export const serveM3u8Controller = async (req: Request, res: Response) => {
  const { id } = req.params
  const videoHLSPath = path.resolve(UPLOAD_VIDEO_DIR, id, 'master.m3u8')
  return res.sendFile(videoHLSPath, (err) => {
    if (err) {
      res.status(HttpStatus.NOT_FOUND).json({
        message: UsersMessages.VIDEO_HLS_NOT_FOUND
      })
    }
  })
}

export const serveSegmentController = async (req: Request, res: Response) => {
  const { id, v, segment } = req.params

  // segment example: segment0.ts, segment1.ts, ...
  const videoHLSPath = path.resolve(UPLOAD_VIDEO_DIR, id, v, segment)
  return res.sendFile(videoHLSPath, (err) => {
    if (err) {
      res.status(HttpStatus.NOT_FOUND).json({
        message: UsersMessages.VIDEO_HLS_NOT_FOUND
      })
    }
  })
}

export const serveSegmentTestController = async (req: Request, res: Response) => {
  const { id, segment } = req.params

  // segment example: segment0.ts, segment1.ts, ...
  const videoHLSPath = path.resolve(UPLOAD_VIDEO_DIR, id, segment)
  return res.sendFile(videoHLSPath, (err) => {
    if (err) {
      res.status(HttpStatus.NOT_FOUND).json({
        message: UsersMessages.VIDEO_HLS_NOT_FOUND
      })
    }
  })
}
