import { Collection, Db, MongoClient } from 'mongodb'
import { config } from 'dotenv'
import User from '~/models/schemas/User.schema'
import RefreshToken from '~/models/schemas/RefreshToken.schema'
import Follower from '~/models/schemas/Followers.schema'
import VideoStatus from '~/models/schemas/VideoStatus.schema'
import Tweet from '~/models/schemas/Tweet.schema'
import Hashtag from '~/models/schemas/Hashtag.schema'
import { Bookmarks } from '~/models/schemas/BookMarks.schema'
import { Like } from '~/models/schemas/Likes.schema'
import Conversation from '~/models/schemas/Conversation.schema'
import { envConfig } from '~/constants/config'

config()
const uri = `mongodb+srv://${envConfig.dbUsername}:${envConfig.dbPassword}@twitter.ve28vlz.mongodb.net/?retryWrites=true&w=majority`

class DatabaseService {
  private client: MongoClient
  private db: Db
  constructor() {
    this.client = new MongoClient(uri)
    this.db = this.client.db(envConfig.dbName)
  }

  /**
   * connect to database
   */
  async connect() {
    try {
      // Send a ping to confirm a successfull connection
      await this.db.command({ ping: 1 })
      console.log('Pinged your deployment. You successfully connected to MongoDB!')
    } catch (error) {
      console.log(error)
      throw error
    }
  }

  async indexUser() {
    const exits = await this.users.indexExists(['email_1', 'email_1_password_1', 'username_1'])
    if (!exits) {
      this.users.createIndex({ email: 1, password: 1 })
      this.users.createIndex({ email: 1 }, { unique: true })
      this.users.createIndex({ username: 1 }, { unique: true })
    }
  }

  async indexRefreshToken() {
    const exits = await this.users.indexExists(['exp_1', 'token_1'])
    if (!exits) {
      this.refreshTokens.createIndex({ token: 1 })
      this.refreshTokens.createIndex({ exp: 1 }, { expireAfterSeconds: 0 })
    }
  }

  async indexVideoStatus() {
    const exits = await this.users.indexExists(['name_1'])
    if (!exits) {
      this.videoStatus.createIndex({ name: 1 })
    }
  }

  async indexFollower() {
    const exits = this.followers.indexExists(['user_id_1', 'followed_user_id_1'])
    if (!exits) {
      this.followers.createIndex({ user_id: 1, followed_user_id: 1 })
    }
  }

  async indexTweets() {
    const exits = await this.tweets.indexExists(['content_text'])
    if (!exits) {
      this.tweets.createIndex({ content: 'text' }, { default_language: 'none' })
    }
  }

  get users(): Collection<User> {
    return this.db.collection(envConfig.dbUsersCollection as string)
  }

  get refreshTokens(): Collection<RefreshToken> {
    return this.db.collection(envConfig.dbRefreshTokensCollection as string)
  }

  get followers(): Collection<Follower> {
    return this.db.collection(envConfig.dbFollowersCollection as string)
  }

  get videoStatus(): Collection<VideoStatus> {
    return this.db.collection(envConfig.dbVideoStatusCollection as string)
  }

  get tweets(): Collection<Tweet> {
    return this.db.collection(envConfig.dbTweetsCollection as string)
  }

  get hashtags(): Collection<Hashtag> {
    return this.db.collection(envConfig.dbHashtagsCollection as string)
  }

  get bookmarks(): Collection<Bookmarks> {
    return this.db.collection(envConfig.dbBookmarksCollection as string)
  }

  get likes(): Collection<Like> {
    return this.db.collection(envConfig.dbLikesCollection as string)
  }

  get conversations(): Collection<Conversation> {
    return this.db.collection(envConfig.dbConversationCollection as string)
  }
}

const databaseService = new DatabaseService()
export default databaseService
