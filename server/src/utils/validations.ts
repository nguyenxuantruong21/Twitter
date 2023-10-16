import { Response, Request, NextFunction } from 'express'
import { validationResult, ValidationChain } from 'express-validator'
import { RunnableValidationChains } from 'express-validator/src/middlewares/schema'
import HTTP_STATUS from '~/constants/httpStatusCode'
import { EntityError, ErrorWithStatus } from '~/models/Errors'

// sequential processing, stops running validations chain if the previous one fails.
export const validate = (validation: RunnableValidationChains<ValidationChain>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    await validation.run(req)
    const errors = validationResult(req)
    // no error
    if (errors.isEmpty()) {
      return next()
    }
    const errorsObject = errors.mapped()
    const entityError = new EntityError({ error: {} })
    for (const key in errorsObject) {
      // handle error with status !== 422
      const { msg } = errorsObject[key]
      if (msg instanceof ErrorWithStatus && msg.status !== HTTP_STATUS.UNPROCESSABLE_ENTITY) {
        return next(msg)
      }
      // handle error with status === 422
      entityError.error[key] = errorsObject[key]
    }
    next(entityError)
  }
}
