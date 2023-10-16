import { Router } from 'express'
import {
  changePasswordController,
  followController,
  forgotPasswordController,
  getMeController,
  getProfileController,
  loginController,
  logoutController,
  oauthController,
  registerController,
  resendVerifyEmailController,
  resetPasswordController,
  unFollowController,
  updateMeController,
  // updateMeController,
  verifyEmailController,
  verifyForgotPasswordController
} from '~/controllers/users.controllers'
import { filterMiddleware } from '~/middlewares/common.middlewares'
import {
  accessTokenValidator,
  changePasswordValidator,
  followValidator,
  forgotPasswordValidator,
  loginValidator,
  refreshTokenValidator,
  registerValidator,
  resetPasswordValidator,
  unFollowValidator,
  updateMeValidator,
  verifiedUserValidator,
  verifyEmailValidator,
  verifyForgotPasswordTokenValidator
} from '~/middlewares/users.middlewares'
import { UpdateMeReqBody } from '~/models/requests/User.requests'
import { wrapRequestHandler } from '~/utils/handlers'

const usersRouter = Router()
/**
 * description:  login a user
 * path: /login
 * Method: POST
 * body: {}
 */
usersRouter.post('/login', loginValidator, wrapRequestHandler(loginController))

/**
 * description:  oauth login with google
 * path: /oauth/google
 * Method: get
 * body: {}
 */
usersRouter.get('/oauth/google', wrapRequestHandler(oauthController))

/**
 * description:  register a user
 * path: /register
 * Method: POST
 * body: {}
 */
usersRouter.post('/register', registerValidator, wrapRequestHandler(registerController))

/**
 * description: logout a user
 * path: /logout
 * Method: POST
 * header: {Authorization: Bearer <access_token>}
 * body: {refresh_token:string}
 */
usersRouter.post('/logout', accessTokenValidator, refreshTokenValidator, wrapRequestHandler(logoutController))

/**
 * description: verify email
 * path: /verify-email
 * methot: POST
 * body: {email-verify-token}
 */
usersRouter.post('/verify-email', verifyEmailValidator, wrapRequestHandler(verifyEmailController))

/**
 * description: verify email
 * path: /resend-verify-email
 * methot: POST
 * header: {Authorization: Bearer <access_token>}
 * body: {}
 */
usersRouter.post('/resend-verify-email', accessTokenValidator, wrapRequestHandler(resendVerifyEmailController))

/**
 * description: submit email to reset forgot password, send email to user
 * path: /forgot-password
 * method: POST
 * body: {email:string}
 */
usersRouter.post('/forgot-password', forgotPasswordValidator, wrapRequestHandler(forgotPasswordController))

/**
 * description: verify link is  email to reset password,
 * path: /verify-forgot-password
 * method: POST
 * body: {forgot_password_token:string}
 */
usersRouter.post(
  '/verify-forgot-password',
  verifyForgotPasswordTokenValidator,
  wrapRequestHandler(verifyForgotPasswordController)
)

/**
 * description: reset password
 * path: /reset-password
 * method: POST
 * body: {forgot_password_token:string, password:string, confirm_password:string}
 */
usersRouter.post('/reset-password', resetPasswordValidator, wrapRequestHandler(resetPasswordController))

/**
 * description: get me
 * path: /me
 * method: GET
 * header: {Authorization: Beareer <access_token>}
 */
usersRouter.get('/me', accessTokenValidator, wrapRequestHandler(getMeController))

/**
 * description: update my profile
 * path: /me
 * method: patch
 * header: {Authorization: Beareer <access_token>}
 * body: UserSchema
 */
usersRouter.patch(
  '/me',
  accessTokenValidator,
  verifiedUserValidator,
  updateMeValidator,
  filterMiddleware<UpdateMeReqBody>([
    'avatar',
    'bio',
    'cover_photo',
    'date_of_birth',
    'location',
    'name',
    'username',
    'website'
  ]),
  wrapRequestHandler(updateMeController)
)

/**
 * description: get user profile
 * path: /:username
 * method: get
 */
usersRouter.get('/:username', wrapRequestHandler(getProfileController))

/**
 * description: follow some one
 * path: /follow
 * header: {Authorization: Beareer <access_token>}
 * method: post
 * body:{user_id:string}
 */
usersRouter.post(
  '/follow',
  accessTokenValidator,
  verifiedUserValidator,
  followValidator,
  wrapRequestHandler(followController)
)

/**
 * description: un follow some one
 * path: /follow/user_id
 * header: {Authorization: Beareer <access_token>}
 * method: post
 * url:{user_id:string}
 */
usersRouter.delete(
  '/follow/:user_id',
  accessTokenValidator,
  verifiedUserValidator,
  unFollowValidator,
  wrapRequestHandler(unFollowController)
)

/**
 * description: change password
 * path: /change-password
 * header: {Authorization: Beareer <access_token>}
 * method: put
 * body:{old-password, password, confirm password}
 */
usersRouter.put(
  '/change-password',
  accessTokenValidator,
  verifiedUserValidator,
  changePasswordValidator,
  wrapRequestHandler(changePasswordController)
)

export default usersRouter
