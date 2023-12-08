import { Request } from 'express'
import sharp from 'sharp'
import { UPLOAD_IMAGE_DIR } from '~/constants/dir'
import { getNameFromFullname, handleUploadImage, handleUploadVideo } from '~/utils/files'
import fs from 'fs'
import fsPromies from 'fs/promises'
import { envConfig, isProduction } from '~/constants/config'
import { config } from 'dotenv'
import { EncodingStatus, MediaType } from '~/constants/enum'
import { Media } from '~/models/Orther'
import { encodeHLSWithMultipleVideoStreams } from '~/utils/video'
import databaseService from './database.services'
import VideoStatus from '~/models/schemas/VideoStatus.schema'
config()

class Quere {
  items: string[]
  encoding: boolean
  constructor() {
    this.items = []
    this.encoding = false
  }
  async enquere(item: string) {
    this.items.push(item)
    // item = home/dev/destop/twitter/folder/fileName.mp4 => fileName
    const idName = getNameFromFullname(item.split('/').pop() as string)
    await databaseService.videoStatus.insertOne(
      new VideoStatus({
        name: idName,
        status: EncodingStatus.Pending
      })
    )
    this.processEncode()
  }
  async processEncode() {
    if (this.encoding) return
    if (this.items.length > 0) {
      this.encoding = true
      const videoPath = this.items[0]
      const idName = getNameFromFullname(videoPath.split('/').pop() as string)
      await databaseService.videoStatus.updateOne(
        { name: idName },
        {
          $set: {
            status: EncodingStatus.Processing
          },
          $currentDate: {
            updated_at: true
          }
        }
      )
      try {
        await encodeHLSWithMultipleVideoStreams(videoPath)
        this.items.shift()
        await fsPromies.unlink(videoPath)
        await databaseService.videoStatus.updateOne(
          { name: idName },
          {
            $set: {
              status: EncodingStatus.Success
            },
            $currentDate: {
              updated_at: true
            }
          }
        )
        console.log(`encode video ${videoPath} success!!!`)
      } catch (error) {
        await databaseService.videoStatus
          .updateOne(
            { name: idName },
            {
              $set: {
                status: EncodingStatus.Failed
              },
              $currentDate: {
                updated_at: true
              }
            }
          )
          .catch((error) => {
            console.log('Update video status error', error)
          })
        console.log(`encode video ${videoPath} error!!!`)
        console.log(error)
      }
      this.encoding = false
      this.processEncode()
    } else {
      console.log('encode video is empty')
    }
  }
}

const quere = new Quere()

class MediasService {
  async uploadImage(req: Request) {
    const files = await handleUploadImage(req)
    const result: Media[] = await Promise.all(
      files.map(async (file) => {
        const newName = getNameFromFullname(file.newFilename)
        const newPath = UPLOAD_IMAGE_DIR + `/${newName}.jpg`
        await sharp(file.filepath).jpeg().toFile(newPath)
        fs.unlinkSync(file.filepath)
        return {
          url: isProduction
            ? `${envConfig.host}/static/image/${newName}.jpg`
            : `http://localhost:${envConfig.port}/static/image/${newName}.jpg`,
          type: MediaType.Image
        }
      })
    )
    return result
  }

  async uploadVideo(req: Request) {
    const files = await handleUploadVideo(req)
    const result: Media[] = files.map((file) => {
      return {
        url: isProduction
          ? `${envConfig.host}/static/video-stream/${file.newFilename}`
          : `http://localhost:${envConfig.port}/static/video-stream/${file.newFilename}`,
        type: MediaType.Video
      }
    })
    return result
  }

  async uploadVideoHLS(req: Request) {
    const files = await handleUploadVideo(req)
    const result: Media[] = await Promise.all(
      files.map(async (file) => {
        const newName = getNameFromFullname(file.newFilename)
        // await encodeHLSWithMultipleVideoStreams(file.filepath)
        // await fsPromies.unlink(file.filepath)
        quere.enquere(file.filepath)
        return {
          url: isProduction
            ? `${envConfig.host}/static/video-hls/${newName}.m3u8`
            : `http://localhost:${envConfig.port}/static/video-hls/${newName}.m3u8`,
          type: MediaType.Video
        }
      })
    )
    return result
  }

  async getVideoStatus(name: string) {
    const data = await databaseService.videoStatus.findOne({ name: name })
    return data
  }
}
const mediasService = new MediasService()
export default mediasService
