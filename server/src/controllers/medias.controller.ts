import { NextFunction, Request, Response } from 'express'
import { handleUploadSingleImage } from '~/utils/files'

export const uploadSingleImageController = async (req: Request, res: Response, next: NextFunction) => {
  const result = await handleUploadSingleImage(req)
  return res.json({
    data: result
  })
}
