import { TweetRequestBody } from '~/models/requests/Tweet.request'
import databaseService from './database.services'
import Tweet from '~/models/schemas/Tweet.schema'
import { ObjectId, WithId } from 'mongodb'
import Hashtag from '~/models/schemas/Hashtag.schema'
import { TweetType } from '~/constants/enum'

class TweetsServices {
  async checkAndCreateHashTags(hashtags: string[]) {
    const hastagDocument = await Promise.all(
      hashtags.map((hashtag) => {
        return databaseService.hashtags.findOneAndUpdate(
          { name: hashtag },
          { $setOnInsert: new Hashtag({ name: hashtag }) },
          { upsert: true, returnDocument: 'after' }
        )
      })
    )
    return hastagDocument.map((hashtag) => hashtag?._id as ObjectId)
  }

  async createTweet(user_id: string, body: TweetRequestBody) {
    const hashtags = await this.checkAndCreateHashTags(body.hashtags)
    const tweet = databaseService.tweets.insertOne(
      new Tweet({
        audience: body.audience,
        content: body.content,
        hashtags: hashtags,
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

  async getTweet(tweet_id: string, user_id?: string) {
    /**
     * chech xem user da dang nhap hay chua
     * neu dang nhap roi thi tang user_views con chua dang nhap thi tang guest_views
     * */
    const inc = user_id ? { user_views: 1 } : { guest_views: 1 }
    const result = await databaseService.tweets.findOneAndUpdate(
      { _id: new ObjectId(tweet_id) },
      {
        $inc: inc,
        $currentDate: {
          updated_at: true
        }
      },
      {
        returnDocument: 'after',
        projection: {
          user_views: 1,
          guest_views: 1,
          updated_at: 1
        }
      }
    )
    return result as WithId<{
      user_views: number
      guest_views: number
      updated_at: Date
    }>
  }

  // phan trang
  async getTweetChildren({
    tweet_id,
    page,
    limit,
    tweet_type,
    user_id
  }: {
    tweet_id: string
    page: number
    limit: number
    tweet_type: TweetType
    user_id?: string
  }) {
    const tweets = await databaseService.tweets
      .aggregate<Tweet>([
        {
          $match: {
            parent_id: new ObjectId(tweet_id),
            type: tweet_type
          }
        },
        {
          $lookup: {
            from: 'hashtags',
            localField: 'hashtags',
            foreignField: '_id',
            as: 'hashtags'
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'mentions',
            foreignField: '_id',
            as: 'mentions'
          }
        },
        {
          $addFields: {
            mentions: {
              $map: {
                input: '$mentions',
                as: 'mention',
                in: {
                  _id: '$$mention._id',
                  name: '$$mention.name',
                  username: '$$mention.username',
                  email: '$$mention.email'
                }
              }
            }
          }
        },
        {
          $lookup: {
            from: 'bookmarks',
            localField: '_id',
            foreignField: 'tweet_id',
            as: 'bookmarks'
          }
        },
        {
          $lookup: {
            from: 'likes',
            localField: '_id',
            foreignField: 'tweet_id',
            as: 'likes'
          }
        },
        {
          $lookup: {
            from: 'tweets',
            localField: '_id',
            foreignField: 'parent_id',
            as: 'tweet_children'
          }
        },
        {
          $addFields: {
            bookmarks: {
              $size: '$bookmarks'
            },
            likes: {
              $size: '$likes'
            },
            retweet_count: {
              $size: {
                $filter: {
                  input: '$tweet_children',
                  as: 'item',
                  cond: {
                    $eq: ['$$item.type', TweetType.Retweet]
                  }
                }
              }
            },
            comment_count: {
              $size: {
                $filter: {
                  input: '$tweet_children',
                  as: 'item',
                  cond: {
                    $eq: ['$$item.type', TweetType.Comment]
                  }
                }
              }
            },
            quote_count: {
              $size: {
                $filter: {
                  input: '$tweet_children',
                  as: 'item',
                  cond: {
                    $eq: ['$$item.type', TweetType.QuoteTweet]
                  }
                }
              }
            }
          }
        },
        {
          $project: {
            tweet_children: 0
          }
        },
        {
          $skip: limit * (page - 1) // Công thức phân trang
        },
        {
          $limit: limit
        }
      ])
      .toArray()
    // lay id cac tweet children
    const ids = tweets.map((tweet) => tweet._id as ObjectId)
    // tang view cho moi lan get
    const inc = user_id ? { user_views: 1 } : { guest_views: 1 }
    await databaseService.tweets.updateMany(
      {
        _id: {
          $in: ids
        }
      },
      {
        $inc: inc,
        $set: {
          updated_at: new Date()
        }
      }
    )
    // hien thi cho UI thu cong
    tweets.forEach((tweet) => {
      tweet.updated_at = new Date()
      if (user_id) {
        tweet.user_views += 1
      } else {
        tweet.guest_views += 1
      }
    })
    const total = await databaseService.tweets.countDocuments({ parent_id: new ObjectId(tweet_id), type: tweet_type })
    return {
      tweets,
      total
    }
  }

  async getNewFeeds({ user_id, limit, page }: { user_id: string; limit: number; page: number }) {
    const user_id_obj = new ObjectId(user_id)
    const followed_user_id = await databaseService.followers
      .find(
        { user_id: user_id_obj },
        {
          projection: {
            followed_user_id: 1
          }
        }
      )
      .toArray()
    const ids = followed_user_id.map((item) => item.followed_user_id)
    // lay luon ca newfeed ca ban than
    ids.push(user_id_obj)
    const tweets = await databaseService.tweets
      .aggregate([
        {
          $match: {
            user_id: {
              $in: ids
            }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'user_id',
            foreignField: '_id',
            as: 'user'
          }
        },
        {
          $unwind: {
            path: '$user'
          }
        },
        {
          $match: {
            $or: [
              {
                audience: 0
              },
              {
                $and: [
                  {
                    audience: 1
                  },
                  {
                    'user.tweet_circle': {
                      $in: []
                    }
                  }
                ]
              }
            ]
          }
        },
        {
          $skip: limit * (page - 1)
        },
        {
          $limit: limit
        },
        {
          $lookup: {
            from: 'hashtags',
            localField: 'hashtags',
            foreignField: '_id',
            as: 'hashtags'
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'mentions',
            foreignField: '_id',
            as: 'mentions'
          }
        },
        {
          $addFields: {
            mentions: {
              $map: {
                input: '$mentions',
                as: 'mention',
                in: {
                  _id: '$$mention._id',
                  name: '$$mention.name',
                  username: '$$mention.username',
                  email: '$$mention.email'
                }
              }
            }
          }
        },
        {
          $lookup: {
            from: 'bookmarks',
            localField: '_id',
            foreignField: 'tweet_id',
            as: 'bookmarks'
          }
        },
        {
          $lookup: {
            from: 'likes',
            localField: '_id',
            foreignField: 'tweet_id',
            as: 'likes'
          }
        },
        {
          $lookup: {
            from: 'tweets',
            localField: '_id',
            foreignField: 'parent_id',
            as: 'tweet_children'
          }
        },
        {
          $addFields: {
            likes: {
              $size: '$likes'
            },
            bookmarks: {
              $size: '$bookmarks'
            },
            retweet_count: {
              $size: {
                $filter: {
                  input: '$tweet_children',
                  as: 'item',
                  cond: {
                    $eq: ['$$item.type', TweetType.Retweet]
                  }
                }
              }
            },
            comment_count: {
              $size: {
                $filter: {
                  input: '$tweet_children',
                  as: 'item',
                  cond: {
                    $eq: ['$$item.type', TweetType.Comment]
                  }
                }
              }
            },
            quote_count: {
              $size: {
                $filter: {
                  input: '$tweet_children',
                  as: 'item',
                  cond: {
                    $eq: ['$$item.type', TweetType.QuoteTweet]
                  }
                }
              }
            }
          }
        },
        {
          $project: {
            tweet_children: 0,
            user: {
              password: 0,
              email_verify_token: 0,
              forgot_password_token: 0,
              tweet_circle: 0,
              date_of_birth: 0
            }
          }
        }
      ])
      .toArray()
    const tweet_id = tweets.map((tweet) => tweet._id as ObjectId)
    await databaseService.tweets.updateMany(
      {
        _id: {
          $in: tweet_id
        }
      },
      {
        $inc: { user_views: 1 },
        $set: {
          updated_at: new Date()
        }
      }
    )
    // tong page
    const total = await databaseService.tweets
      .aggregate([
        {
          $match: {
            user_id: {
              $in: ids
            }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'user_id',
            foreignField: '_id',
            as: 'user'
          }
        },
        {
          $unwind: {
            path: '$user'
          }
        },
        {
          $match: {
            $or: [
              {
                audience: 0
              },
              {
                $and: [
                  {
                    audience: 1
                  },
                  {
                    'user.tweet_circle': {
                      $in: []
                    }
                  }
                ]
              }
            ]
          }
        },
        {
          $count: 'total'
        }
      ])
      .toArray()
    // tang view hien thi cho client
    tweets.forEach((tweet) => {
      ;(tweet.updated_at = new Date()), (tweet.user_views += 1)
    })
    return {
      tweets,
      total: total[0].total
    }
  }
}

const tweetsServices = new TweetsServices()
export default tweetsServices
