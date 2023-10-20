import { Request } from 'express'
import sharp from 'sharp'
import { UPLOAD_DIR, UPLOAD_TEMP_DIR } from '~/constants/dir'
import { getNameFromFullname, handleUploadSingleImage } from '~/utils/files'
import fs from 'fs'
class MediasService {
  async handleUploadSingleImage(req: Request) {
    const file = await handleUploadSingleImage(req)
    const newName = getNameFromFullname(file.newFilename)
    const newPath = UPLOAD_DIR + `/${newName}.jpg`
    await sharp(file.filepath).jpeg().toFile(newPath)
    fs.unlinkSync(file.filepath)
    return `http://localhost:3000/uploads/${newName}.jpg`
  }
}
const mediasService = new MediasService()
export default mediasService
