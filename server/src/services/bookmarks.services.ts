import { Bookmarks } from '~/models/schemas/BookMarks.schema'
import databaseService from './database.services'
import { ObjectId, WithId } from 'mongodb'

class BookmarksServices {
  async bookMarksTweet(user_id: string, tweet_id: string) {
    const result = await databaseService.bookmarks.findOneAndUpdate(
      { user_id: new ObjectId(user_id), tweet_id: new ObjectId(tweet_id) },
      {
        $setOnInsert: new Bookmarks({
          user_id: new ObjectId(user_id),
          tweet_id: new ObjectId(tweet_id)
        })
      },
      { upsert: true, returnDocument: 'after' }
    )
    return result
  }

  async unBookMarksTweet(user_id: string, tweet_id: string) {
    const result = await databaseService.bookmarks.findOneAndDelete({
      user_id: new ObjectId(user_id),
      tweet_id: new ObjectId(tweet_id)
    })
    return result
  }
}

const bookmarksServices = new BookmarksServices()
export default bookmarksServices
