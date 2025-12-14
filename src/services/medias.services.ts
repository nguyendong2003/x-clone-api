import { Request } from 'express'
import path from 'path'
import sharp from 'sharp'
import { UPLOAD_IMAGE_DIR, UPLOAD_VIDEO_DIR } from '~/constants/dir'
import { getFiles, handleUploadImage, handleUploadVideo, handleUploadVideoHLS } from '~/utils/file'
import fs from 'fs'
import { EnvConfig, isProduction } from '~/config/config'
import { MediaType, VideoEncodeStatus } from '~/constants/enums'
import { Media } from '~/models/Other'
import { encodeHLSWithMultipleVideoStreams } from '~/utils/video'
import databaseService from './database.services'
import VideoStatus from '~/models/schemas/VideoStatus.schemas'
import { uploadFileToS3 } from '~/utils/s3'
import mime from 'mime'
import { CompleteMultipartUploadCommandOutput } from '@aws-sdk/client-s3'
import { rimrafSync } from 'rimraf'

/**
 * Queue class to manage video encoding tasks
 */
interface Item {
  filepath: string
  idName: string
}

class Queue {
  items: Item[]
  encoding: boolean

  constructor() {
    this.items = []
    this.encoding = false
  }

  async enqueue(item: Item) {
    this.items.push(item)

    const idName = item.idName
    await databaseService.videoStatus.insertOne(
      new VideoStatus({
        name: idName,
        status: VideoEncodeStatus.Pending
      })
    )
    this.processQueue()
  }

  async processQueue() {
    if (this.encoding || this.items.length === 0) return
    if (this.items.length > 0) {
      this.encoding = true
      const videoItem = this.items[0]
      const idName = videoItem.idName
      await databaseService.videoStatus.updateOne(
        {
          name: idName
        },
        {
          $set: {
            status: VideoEncodeStatus.Processing
          },
          $currentDate: {
            updated_at: true
          }
        }
      )

      try {
        await encodeHLSWithMultipleVideoStreams(videoItem.filepath)
        await fs.promises.unlink(videoItem.filepath) // Xóa file gốc sau khi đã chuyển đổi

        // Lấy tất cả các file đã được tạo ra trong thư mục con của video HLS và upload lên S3. Sau đó xóa thư mục local
        const files = getFiles(path.resolve(UPLOAD_VIDEO_DIR, idName))
        await Promise.all(
          files.map((filepath) => {
            // Lấy path tương đối từ UPLOAD_VIDEO_DIR. Example -> relativePath: abc123/v0/fileSequence0.ts
            const relativePath = path.relative(path.resolve(UPLOAD_VIDEO_DIR), filepath)

            // Chuẩn hóa cho S3
            const s3Key = `videos-hls/${relativePath.split(path.sep).join('/')}`

            return uploadFileToS3({
              filepath,
              filename: s3Key,
              contentType: mime.getType(filepath) as string
            })
          })
        )

        rimrafSync(path.resolve(UPLOAD_VIDEO_DIR, idName)) // Xóa thư mục local sau khi đã upload lên S3
        //

        await databaseService.videoStatus.updateOne(
          {
            name: idName
          },
          {
            $set: {
              status: VideoEncodeStatus.Success
            },
            $currentDate: {
              updated_at: true
            }
          }
        )
        console.log(`Encode video ${idName} - ${videoItem.filepath} success`)
      } catch (error) {
        await databaseService.videoStatus
          .updateOne(
            {
              name: idName
            },
            {
              $set: {
                status: VideoEncodeStatus.Failed
              },
              $currentDate: {
                updated_at: true
              }
            }
          )
          .catch((err) => {
            console.error('Update video status failed error:', err)
          })
        console.error(`Error encoding ${idName} - ${videoItem.filepath} error:`, error)
      }
      this.items.shift()
      this.encoding = false
      this.processQueue()
    } else {
      console.log('Encode video queue is empty')
    }
  }
}

const encodeQueue = new Queue()

class MediasService {
  async uploadImage(req: Request) {
    const files = await handleUploadImage(req)
    const result: Media[] = await Promise.all(
      files.map(async (file) => {
        const newFilename = file.newFilename.split('.')[0]
        const newFullFilename = `${newFilename}.jpg`
        const newFilePath = path.resolve(UPLOAD_IMAGE_DIR, newFullFilename)

        await sharp(file.filepath).jpeg().toFile(newFilePath)

        const s3Result = await uploadFileToS3({
          filename: 'images/' + newFullFilename,
          filepath: newFilePath,
          contentType: mime.getType(newFilePath) as string
        })

        await Promise.all([
          fs.promises.unlink(file.filepath), // Xóa file tạm sau khi đã chuyển đổi và lưu
          fs.promises.unlink(newFilePath) // Xóa file local sau khi đã upload lên S3
        ])

        return {
          url: (s3Result as CompleteMultipartUploadCommandOutput).Location as string,
          type: MediaType.Image
        }

        // return {
        //   url: isProduction
        //     ? `${EnvConfig.BASE_URL}/static/image/${newFullFilename}`
        //     : `http://localhost:${EnvConfig.PORT}/static/image/${newFullFilename}`,
        //   type: MediaType.Image
        // }
      })
    )

    return result
  }

  async uploadVideo(req: Request) {
    const files = await handleUploadVideo(req)
    const result: Media[] = await Promise.all(
      files.map(async (file) => {
        const newFilename = file.newFilename

        const s3Result = await uploadFileToS3({
          filename: 'videos/' + newFilename,
          filepath: file.filepath,
          contentType: mime.getType(file.filepath) as string
        })

        // Xóa file local sau khi đã upload lên S3
        fs.promises.unlink(file.filepath)

        return {
          url: (s3Result as CompleteMultipartUploadCommandOutput).Location as string,
          type: MediaType.Video
        }

        // return {
        //   url: isProduction
        //     ? `${EnvConfig.BASE_URL}/static/video/${newFilename}`
        //     : `http://localhost:${EnvConfig.PORT}/static/video/${newFilename}`,
        //   type: MediaType.Video
        // }
      })
    )
    return result
  }

  async uploadVideoHLS(req: Request) {
    const files = await handleUploadVideoHLS(req)
    const result: Media[] = await Promise.all(
      files.map(async (file) => {
        const idName = file.newFilename.split('.')[0]
        encodeQueue.enqueue({
          filepath: file.filepath,
          idName
        })
        return {
          url: isProduction
            ? `${EnvConfig.BASE_URL}/static/video-hls/${idName}/master.m3u8`
            : `http://localhost:${EnvConfig.PORT}/static/video-hls/${idName}/master.m3u8`,
          type: MediaType.VideoHLS
        }
      })
    )

    return result
  }

  async getVideoEncodeStatus(id: string) {
    const status = await databaseService.videoStatus.findOne({ name: id })
    return status
  }
}

const mediasService = new MediasService()

export default mediasService
