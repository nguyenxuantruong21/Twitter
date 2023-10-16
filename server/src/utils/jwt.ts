import { config } from 'dotenv'
import { JwtPayload, SignOptions, sign, verify } from 'jsonwebtoken'
import { TokenPayload } from '~/models/requests/User.requests'
config()

export const signToken = ({
  payload,
  privateKey,
  options = {
    algorithm: 'HS256'
  }
}: {
  payload: string | Buffer | object
  privateKey: string
  options?: SignOptions
}) => {
  return new Promise<string>((resolve, reject) => {
    sign(payload, privateKey, options, (error, token) => {
      if (error) {
        throw reject(error)
      }
      resolve(token as string)
    })
  })
}

export const verifyToken = ({ token, secretOrpublicKey }: { token: string; secretOrpublicKey: string }) => {
  return new Promise<TokenPayload>((resolve, reject) => {
    verify(token, secretOrpublicKey, (error, decode) => {
      if (error) {
        throw reject(error)
      }
      resolve(decode as TokenPayload)
    })
  })
}
