import { ObjectId } from 'mongodb'

interface BookmarkType {
  _id?: ObjectId
  user_id: ObjectId
  tweet_id: ObjectId
  created_at?: Date
}

export class Bookmarks {
  _id: ObjectId
  user_id: ObjectId
  tweet_id: ObjectId
  created_at?: Date
  constructor({ _id, user_id, tweet_id, created_at }: BookmarkType) {
    const date = new Date()
    this._id = _id || new ObjectId()
    this.user_id = user_id
    this.tweet_id = tweet_id
    this.created_at = created_at || date
  }
}
