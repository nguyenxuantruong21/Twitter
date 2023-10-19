import { Request } from 'express'
import { handleUploadSingleImage } from '~/utils/files'

class MediasService {
  async handleUploadSingleImage(req: Request) {
    const file = await handleUploadSingleImage(req)
  }
}
const mediasService = new MediasService()
export default mediasService
