import { config } from 'dotenv'
import { createHash } from 'node:crypto'
config()

const sha256 = (content: string) => {
  return createHash('sha256').update(content).digest('hex')
}

// hash password with password secret
export const hashPassword = (password: string) => {
  return sha256(password + process.env.PASSWORD_SECRET)
}
