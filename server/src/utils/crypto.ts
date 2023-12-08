import { config } from 'dotenv'
import { createHash } from 'node:crypto'
import { envConfig } from '~/constants/config'
config()

const sha256 = (content: string) => {
  return createHash('sha256').update(content).digest('hex')
}

// hash password with password secret
export const hashPassword = (password: string) => {
  return sha256(password + envConfig.passwordSecret)
}
