import { TweetRequestBody } from '~/models/requests/Tweet.request'
import databaseService from './database.services'
import Tweet from '~/models/schemas/Tweet.schema'
import { ObjectId } from 'mongodb'

class TweetsServices {
  async createTweet(user_id: string, body: TweetRequestBody) {
    const tweet = databaseService.tweets.insertOne(
      new Tweet({
        audience: body.audience,
        content: body.content,
        hashtags: [],
        mentions: body.mentions,
        medias: body.medias,
        parent_id: body.parent_id,
        type: body.type,
        user_id: new ObjectId(user_id)
      })
    )
    const result = await databaseService.tweets.findOne({ _id: (await tweet).insertedId })
    return result
  }
}

const tweetsServices = new TweetsServices()
export default tweetsServices
