import { ChangePasswordReqBody, RegisterReqBody, UpdateMeReqBody } from '~/models/requests/User.requests'
import databaseService from './database.services'
import User from '~/models/schemas/User.schema'
import { hashPassword } from '~/utils/crypto'
import { signToken, verifyToken } from '~/utils/jwt'
import { TokenType, UserVerifyStatus } from '~/constants/enum'
import { ObjectId } from 'mongodb'
import { config } from 'dotenv'
import { USERS_MESSAGES } from '~/constants/messages'
import { ErrorWithStatus } from '~/models/Errors'
import HTTP_STATUS from '~/constants/httpStatusCode'
import axios, { HttpStatusCode } from 'axios'
import RefreshToken from '~/models/schemas/RefreshToken.schema'
import Follower from '~/models/schemas/Followers.schema'
import { envConfig } from '~/constants/config'
config()

class UserService {
  private signAccessToken = ({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) => {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.AccessToken,
        verify
      },
      privateKey: envConfig.jwtSecretAccessToken as string,
      options: {
        expiresIn: envConfig.accessTokenExpiresIn
      }
    })
  }

  private signRefreshToken = ({
    user_id,
    verify,
    exp
  }: {
    user_id: string
    verify: UserVerifyStatus
    exp?: number
  }) => {
    if (exp) {
      return signToken({
        payload: {
          user_id,
          token_type: TokenType.RefreshToken,
          verify,
          exp
        },
        privateKey: envConfig.jwtSecretRefreshToken as string
      })
    }
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.RefreshToken,
        verify
      },
      privateKey: envConfig.jwtSecretRefreshToken as string,
      options: {
        expiresIn: envConfig.refreshTokenExpiresIn
      }
    })
  }

  private signEmailVerifyToken = ({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) => {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.EmailVerifyToken,
        verify
      },
      privateKey: envConfig.jwtSecretEmailVerifyToken as string,
      options: {
        expiresIn: envConfig.emailVerifyTokenExpiresIn
      }
    })
  }

  private signForgotPasswordToken = ({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) => {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.ForgotPasswordToken,
        verify
      },
      privateKey: envConfig.jwtSecretForgotPasswordToken as string,
      options: {
        expiresIn: envConfig.forgotPasswordTokenExpiresIn
      }
    })
  }

  private signAccessTokenAndRefreshToken = async ({
    user_id,
    verify
  }: {
    user_id: string
    verify: UserVerifyStatus
  }) => {
    return Promise.all([this.signAccessToken({ user_id, verify }), this.signRefreshToken({ user_id, verify })])
  }

  /**
   *
   * @param code
   * @returns { access_token: string ,id_token: string }
   */
  private async getOauthGoogleToken(code: string) {
    const body = {
      code,
      client_id: envConfig.googleClientId,
      client_secret: envConfig.googleClientSecret,
      redirect_uri: envConfig.googleRedirectUri,
      grant_type: 'authorization_code'
    }
    const { data } = await axios.post('https://oauth2.googleapis.com/token', body, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })
    return data as {
      access_token: string
      id_token: string
    }
  }

  /**
   *
   * @param access_token
   * @param id_token
   * @returns information in user sign in google
   */
  private async getGoogleUserInfo(access_token: string, id_token: string) {
    const { data } = await axios.get('https://www.googleapis.com/oauth2/v1/userinfo', {
      params: { access_token, alt: 'json' },
      headers: { Authorization: `Bearer ${id_token}` }
    })
    return data as {
      id: string
      email: string
      verified_email: boolean
      name: string
      given_name: string
      family_name: string
      picture: string
      locale: string
    }
  }

  /**
   * @param refresh_token
   * @returns {decoded refresh_token}
   */
  private decodeRefreshToken(refresh_token: string) {
    return verifyToken({ token: refresh_token, secretOrpublicKey: envConfig.jwtSecretRefreshToken as string })
  }

  /// METHOD FOR USER
  /**
   *
   * @param {payload}
   * @returns {
   *  insert user in database
   *  sign access_token and refresh_token
   * insert refresh_token in database
   * }
   */
  async register(payload: RegisterReqBody) {
    const user_id = new ObjectId()
    const email_verify_token = await this.signEmailVerifyToken({
      user_id: user_id.toString(),
      verify: UserVerifyStatus.Unverified
    })
    await databaseService.users.insertOne(
      new User({
        ...payload,
        _id: user_id,
        username: `user${user_id.toString()}`,
        email_verify_token,
        date_of_birth: new Date(payload.date_of_birth),
        password: hashPassword(payload.password)
      })
    )
    // const user_id = result.insertedId.toString()
    const [access_token, refresh_token] = await this.signAccessTokenAndRefreshToken({
      user_id: user_id.toString(),
      verify: UserVerifyStatus.Unverified
    })
    const { exp, iat } = await this.decodeRefreshToken(refresh_token)
    databaseService.refreshTokens.insertOne(
      new RefreshToken({
        user_id: new ObjectId(user_id),
        token: refresh_token,
        iat,
        exp
      })
    )
    return {
      access_token,
      refresh_token
    }
  }

  /**
   *
   * @param user_id
   * @returns {access_token, refresh_token}
   */
  async login({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    const [access_token, refresh_token] = await this.signAccessTokenAndRefreshToken({ user_id, verify })
    const { exp, iat } = await this.decodeRefreshToken(refresh_token)
    await databaseService.refreshTokens.insertOne(
      new RefreshToken({
        user_id: new ObjectId(user_id),
        token: refresh_token,
        iat,
        exp
      })
    )
    return {
      access_token,
      refresh_token
    }
  }

  /**
   *
   * @param {code}
   * @returns
   */
  async oauth(code: string) {
    const { access_token, id_token } = await this.getOauthGoogleToken(code)
    const userInfo = await this.getGoogleUserInfo(access_token, id_token)
    if (!userInfo.verified_email) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.GMAIL_NOT_VERIFIED,
        status: HTTP_STATUS.BAD_REQUEST
      })
    }
    // kiem tra email da ton tai hay chua
    const user = await databaseService.users.findOne({ email: userInfo.email })
    // neu ton tai thi cho dang nhap
    if (user) {
      const [access_token, refresh_token] = await this.signAccessTokenAndRefreshToken({
        user_id: user._id.toString(),
        verify: user.verify as UserVerifyStatus
      })
      const { exp, iat } = await this.decodeRefreshToken(refresh_token)
      await databaseService.refreshTokens.insertOne(
        new RefreshToken({
          user_id: user._id,
          token: refresh_token,
          exp,
          iat
        })
      )
      return {
        access_token,
        refresh_token,
        newUser: 0,
        verify: user.verify
      }
    } else {
      const password = Math.random().toString(36).substring(2, 7)
      const data = await this.register({
        email: userInfo.email,
        name: userInfo.name,
        date_of_birth: new Date().toString(),
        password: password,
        confirm_password: password
      })
      return {
        ...data,
        newUser: 1,
        verify: UserVerifyStatus.Unverified
      }
    }
  }

  /**
   *
   * @param email
   * @returns {Boolean()}
   */
  async checkEmailExist(email: string) {
    const result = await databaseService.users.findOne({ email })
    return Boolean(result)
  }

  /**
   *
   * @param refresh_token
   * @returns {delete refresh_token in database}
   */
  async logout(refresh_token: string) {
    await databaseService.refreshTokens.deleteOne({ token: refresh_token })
    return {
      message: USERS_MESSAGES.LOGOUT_SUCCESS
    }
  }

  /**
   *
   * @param refresh_token
   * @param user_id
   * @param verify
   * @param exp
   * 1: sign access_token, refresh_token
   * 2: delete old refresh token
   * @returns {access_token, refresh_token}
   */
  async refreshToken(refresh_token: string, user_id: string, verify: UserVerifyStatus, exp: number) {
    const [new_access_token, new_refresh_token] = await Promise.all([
      this.signAccessToken({ user_id, verify }),
      this.signRefreshToken({ user_id, verify, exp }),
      databaseService.refreshTokens.deleteOne({ token: refresh_token })
    ])
    const { iat } = await this.decodeRefreshToken(refresh_token)
    await databaseService.refreshTokens.insertOne(
      new RefreshToken({
        user_id: new ObjectId(user_id),
        token: new_refresh_token,
        exp,
        iat
      })
    )
    return {
      access_token: new_access_token,
      refresh_token: new_refresh_token
    }
  }
  // thoi diem tiem tai gia tri cap nhat
  // thoi diem ma mongodb no cap nhat
  /**
   *
   * @param user_id
   * @returns {access_token, refresh_token}
   */
  async verifyEmail(user_id: string) {
    await databaseService.users.updateOne({ _id: new ObjectId(user_id) }, [
      {
        $set: {
          email_verify_token: '',
          verify: UserVerifyStatus.Verified,
          updated_at: '$$NOW'
        }
      }
    ])
    const [access_token, refresh_token] = await this.signAccessTokenAndRefreshToken({
      user_id,
      verify: UserVerifyStatus.Verified
    })
    const { exp, iat } = await this.decodeRefreshToken(refresh_token)
    await databaseService.refreshTokens.insertOne(
      new RefreshToken({
        user_id: new ObjectId(user_id),
        token: refresh_token,
        exp,
        iat
      })
    )
    return {
      access_token,
      refresh_token
    }
  }

  /**
   * @param user_id
   * @returns {
   *  sign email verify token
   *  update in database
   * }
   */
  async resendVerifyEmail(user_id: string) {
    const email_verify_token = await this.signEmailVerifyToken({
      user_id: user_id.toString(),
      verify: UserVerifyStatus.Unverified
    })
    await databaseService.users.updateOne(
      { _id: new ObjectId(user_id) },
      {
        $set: {
          email_verify_token
        },
        $currentDate: {
          created_at: true
        }
      }
    )
    return {
      message: USERS_MESSAGES.RESEND_VERIFY_EMAIL_SUCCESS
    }
  }

  /**
   *
   * @param param0
   * @returns {update forgot password token}
   */
  async forgotPassword({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    const forgot_password_token = await this.signForgotPasswordToken({ user_id, verify })
    await databaseService.users.updateOne(
      { _id: new ObjectId(user_id) },
      {
        $set: {
          forgot_password_token
        },
        $currentDate: {
          created_at: true
        }
      }
    )
    // gui email kem link den email nguoi dung: http://twitter.com/forgot-password?token=token
    console.log('forgot password token:', forgot_password_token)
    return {
      message: USERS_MESSAGES.CHECK_EMAIL_TO_RESET_PASSWORD
    }
  }

  /**
   *
   * @param user_id
   * @param password
   * @returns {reset password in database, update new password}
   */
  async resetPassword(user_id: string, password: string) {
    await databaseService.users.updateOne(
      { _id: new ObjectId(user_id) },
      {
        $set: {
          forgot_password_token: '',
          password: hashPassword(password)
        },
        $currentDate: {
          created_at: true
        }
      }
    )
    return {
      message: USERS_MESSAGES.RESET_PASSWORD_SUCCESS
    }
  }

  async getMe(user_id: string) {
    const user = databaseService.users.findOne(
      { _id: new ObjectId(user_id) },
      {
        projection: {
          password: 0,
          email_verify_token: 0,
          forgot_password_token: 0
        }
      }
    )
    return user
  }

  /**
   *
   * @param user_id
   * @param payload
   * @returns {
   *  update information
   * }
   */
  async updateMe(user_id: string, payload: UpdateMeReqBody) {
    const _payload = payload.date_of_birth ? { ...payload, date_of_birth: new Date(payload.date_of_birth) } : payload
    const user = await databaseService.users.findOneAndUpdate(
      { _id: new ObjectId(user_id) },
      {
        $set: {
          ...(_payload as UpdateMeReqBody & { date_of_birth: Date })
        },
        $currentDate: {
          updated_at: true
        }
      },
      {
        returnDocument: 'after',
        projection: {
          password: 0,
          email_verify_token: 0,
          forgot_password_token: 0
        }
      }
    )
    return user
  }

  async getProfile(username: string) {
    const user = await databaseService.users.findOne(
      { username },
      {
        projection: {
          password: 0,
          email_verify_token: 0,
          forgot_password_token: 0,
          created_at: 0,
          updated_at: 0,
          verify: 0
        }
      }
    )
    if (user === null) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.USER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }
    return user
  }

  async follow(user_id: string, followed_user_id: string) {
    const exitFollower = await databaseService.followers.findOne({
      user_id: new ObjectId(user_id),
      followed_user_id: new ObjectId(followed_user_id)
    })
    if (exitFollower === null) {
      await databaseService.followers.insertOne(
        new Follower({
          user_id: new ObjectId(user_id),
          followed_user_id: new ObjectId(followed_user_id)
        })
      )
      return {
        message: USERS_MESSAGES.FOLLOW_SUCCESS
      }
    }
    return {
      message: USERS_MESSAGES.FOLLOWED
    }
  }

  async unFollow(user_id: string, followed_user_id: string) {
    const exitFollower = await databaseService.followers.findOne({
      user_id: new ObjectId(user_id),
      followed_user_id: new ObjectId(followed_user_id)
    })
    if (exitFollower === null) {
      return {
        message: USERS_MESSAGES.ALREADY_UNFOLLOWED
      }
    } else if (exitFollower !== null) {
      await databaseService.followers.findOneAndDelete({
        user_id: new ObjectId(user_id),
        followed_user_id: new ObjectId(followed_user_id)
      })
      return {
        message: USERS_MESSAGES.UNFOLLOW_SUCCESS
      }
    }
  }

  async changePassword(user_id: string, payload: ChangePasswordReqBody) {
    await databaseService.users.findOneAndUpdate(
      { _id: new ObjectId(user_id) },
      {
        $set: {
          password: hashPassword(payload.password)
        },
        $currentDate: {
          updated_at: true
        }
      }
    )
    return {
      message: USERS_MESSAGES.CHANGE_PASSWORD_SUCCESS
    }
  }
}

const userService = new UserService()
export default userService
