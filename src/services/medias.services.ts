import { Request } from 'express'
import path from 'path'
import sharp from 'sharp'
import { UPLOAD_IMAGE_DIR } from '~/constants/dir'
import { handleUploadImage, handleUploadVideo, handleUploadVideoHLS } from '~/utils/file'
import fs from 'fs'
import { isProduction } from '~/config/config'
import { config } from 'dotenv'
import { MediaType, VideoEncodeStatus } from '~/constants/enums'
import { Media } from '~/models/Other'
import { encodeHLSWithMultipleVideoStreams } from '~/utils/video'
import databaseService from './database.services'
import VideoStatus from '~/models/schemas/VideoStatus.schemas'

config()

/**
 * Queue class to manage video encoding tasks
 */
class Queue {
  items: string[]
  encoding: boolean

  constructor() {
    this.items = []
    this.encoding = false
  }

  async enqueue(item: string) {
    this.items.push(item)

    // item example: /home/user/uploads/videos/hwd0umat9dismppijavj88fqx.mp4  => id: hwd0umat9dismppijavj88fqx
    const idName = item.split('/').pop()?.split('.')[0] as string
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
      const videoPath = this.items[0]
      const idName = videoPath.split('/').pop()?.split('.')[0] as string
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
        await encodeHLSWithMultipleVideoStreams(videoPath)
        await fs.promises.unlink(videoPath) // Xóa file gốc sau khi đã chuyển đổi
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
        console.log(`Encode video ${videoPath} success`)
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
        console.error(`Error encoding ${videoPath} error:`, error)
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

  async uploadVideoHLS(req: Request) {
    const files = await handleUploadVideoHLS(req)
    const result: Media[] = await Promise.all(
      files.map(async (file) => {
        // await encodeHLSWithMultipleVideoStreams(file.filepath)
        // await fs.promises.unlink(file.filepath) // Xóa file gốc sau khi đã chuyển đổi
        encodeQueue.enqueue(file.filepath)
        const newFileName = file.newFilename
        return {
          url: isProduction
            ? `${process.env.BASE_URL}/static/video-hls/${newFileName}.m3u8`
            : `http://localhost:${process.env.PORT}/static/video-hls/${newFileName}.m3u8`,
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
